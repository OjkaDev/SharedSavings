from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.models.database import get_db, User, PersonalExpense, Category
from app.schemas.schemas import PersonalExpenseCreate, PersonalExpenseResponse, PersonalSummary
from app.utils.auth import get_current_user

router = APIRouter(prefix="/personal", tags=["Personal Expenses"])


@router.get("/expenses", response_model=List[PersonalExpenseResponse])
def get_personal_expenses(
    type: str = None,
    category_id: int = None,
    start_date: datetime = None,
    end_date: datetime = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PersonalExpense).filter(
        PersonalExpense.user_id == current_user.id
    )

    if type:
        query = query.filter(PersonalExpense.type == type)
    if category_id:
        query = query.filter(PersonalExpense.category_id == category_id)
    if start_date:
        query = query.filter(PersonalExpense.date >= start_date)
    if end_date:
        query = query.filter(PersonalExpense.date <= end_date)

    return query.order_by(PersonalExpense.date.desc()).all()


@router.get("/summary", response_model=PersonalSummary)
def get_personal_summary(
    period: str = "month",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()

    if period == "month":
        start_date = datetime(now.year, now.month, 1)
    elif period == "year":
        start_date = datetime(now.year, 1, 1)
    elif period == "quarter":
        quarter_start_month = ((now.month - 1) // 3) * 3 + 1
        start_date = datetime(now.year, quarter_start_month, 1)
    else:
        start_date = None

    query = db.query(PersonalExpense).filter(
        PersonalExpense.user_id == current_user.id
    )

    if start_date:
        query = query.filter(PersonalExpense.date >= start_date)

    income = (
        query.filter(PersonalExpense.type == "income")
        .with_entities(func.sum(PersonalExpense.amount))
        .scalar()
        or 0
    )

    expenses = (
        query.filter(PersonalExpense.type == "expense")
        .with_entities(func.sum(PersonalExpense.amount))
        .scalar()
        or 0
    )

    category_totals = (
        query.join(Category, PersonalExpense.category_id == Category.id, isouter=True)
        .filter(PersonalExpense.type == "expense")
        .group_by(Category.name)
        .with_entities(
            func.coalesce(Category.name, "Sin categoría"),
            func.sum(PersonalExpense.amount),
        )
        .all()
    )

    by_category = [{"name": name, "total": total} for name, total in category_totals]

    return PersonalSummary(
        income=float(income),
        expenses=float(expenses),
        balance=float(income) - float(expenses),
        by_category=by_category,
    )


@router.post("/expenses", response_model=PersonalExpenseResponse)
def create_personal_expense(
    expense_data: PersonalExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = PersonalExpense(
        user_id=current_user.id,
        amount=expense_data.amount,
        description=expense_data.description,
        category_id=expense_data.category_id,
        date=expense_data.date,
        type=expense_data.type,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}")
def delete_personal_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = (
        db.query(PersonalExpense)
        .filter(
            PersonalExpense.id == expense_id,
            PersonalExpense.user_id == current_user.id,
        )
        .first()
    )

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}
