from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime
from app.models.database import get_db, User, PersonalExpense, Category, Expense, ExpenseSplit
from app.schemas.schemas import PersonalExpenseCreate, PersonalExpenseResponse, PersonalSummary, MonthlyPersonalData
from app.utils.auth import get_current_user

router = APIRouter(prefix="/personal", tags=["Personal Expenses"])


@router.get("/expenses")
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
    ).options(joinedload(PersonalExpense.category))

    if type:
        query = query.filter(PersonalExpense.type == type)
    if category_id:
        query = query.filter(PersonalExpense.category_id == category_id)
    if start_date:
        query = query.filter(PersonalExpense.date >= start_date)
    if end_date:
        query = query.filter(PersonalExpense.date <= end_date)

    expenses = query.order_by(PersonalExpense.date.desc()).all()
    
    result = []
    for exp in expenses:
        shared = db.query(Expense).filter(Expense.personal_expense_id == exp.id).first()
        shared_expense_id = shared.id if shared else None
        
        my_share = None
        if shared_expense_id:
            split = db.query(ExpenseSplit).filter(
                ExpenseSplit.expense_id == shared_expense_id,
                ExpenseSplit.user_id == current_user.id,
            ).first()
            my_share = split.amount if split else None
        
        exp_dict = {
            "id": exp.id,
            "user_id": exp.user_id,
            "amount": exp.amount,
            "description": exp.description,
            "category_id": exp.category_id,
            "date": exp.date,
            "type": exp.type,
            "created_at": exp.created_at,
            "category": exp.category,
            "shared_expense_id": shared_expense_id,
            "my_share": my_share,
        }
        result.append(exp_dict)
    
    return result


@router.get("/summary", response_model=PersonalSummary)
def get_personal_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PersonalExpense).filter(
        PersonalExpense.user_id == current_user.id
    )

    if start_date:
        query = query.filter(PersonalExpense.date >= start_date)
    if end_date:
        query = query.filter(PersonalExpense.date <= end_date)

    income = (
        query.filter(PersonalExpense.type == "income")
        .with_entities(func.sum(PersonalExpense.amount))
        .scalar()
        or 0
    )

    all_expenses = query.filter(PersonalExpense.type == "expense").all()
    
    personal_only_expenses = 0.0
    for exp in all_expenses:
        shared = db.query(Expense).filter(Expense.personal_expense_id == exp.id).first()
        if shared:
            split = db.query(ExpenseSplit).filter(
                ExpenseSplit.expense_id == shared.id,
                ExpenseSplit.user_id == current_user.id,
            ).first()
            if split:
                personal_only_expenses += split.amount
        else:
            personal_only_expenses += exp.amount

    category_totals = []
    by_category_dict = {}
    for exp in all_expenses:
        shared = db.query(Expense).filter(Expense.personal_expense_id == exp.id).first()
        if shared:
            split = db.query(ExpenseSplit).filter(
                ExpenseSplit.expense_id == shared.id,
                ExpenseSplit.user_id == current_user.id,
            ).first()
            amount = split.amount if split else 0
        else:
            amount = exp.amount
        
        cat_name = exp.category.name if exp.category else "Sin categoría"
        by_category_dict[cat_name] = by_category_dict.get(cat_name, 0) + amount

    by_category = [{"name": name, "total": float(total)} for name, total in by_category_dict.items()]

    return PersonalSummary(
        income=float(income),
        expenses=float(personal_only_expenses),
        balance=float(income) - float(personal_only_expenses),
        by_category=by_category,
    )


@router.get("/monthly", response_model=List[MonthlyPersonalData])
def get_monthly_personal(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener desglose mensual de ingresos y gastos personales"""
    if not year:
        year = datetime.utcnow().year

    # Query agrupando por mes
    monthly_data = (
        db.query(
            extract('month', PersonalExpense.date).label('month'),
            PersonalExpense.type,
            func.sum(PersonalExpense.amount).label('total'),
        )
        .filter(
            PersonalExpense.user_id == current_user.id,
            extract('year', PersonalExpense.date) == year,
        )
        .group_by('month', PersonalExpense.type)
        .all()
    )

    # Inicializar los 12 meses con 0
    result = []
    for m in range(1, 13):
        result.append({"month": m, "income": 0.0, "expenses": 0.0, "balance": 0.0})

    # Rellenar con datos reales
    for month_num, exp_type, total in monthly_data:
        idx = int(month_num) - 1
        if exp_type == "income":
            result[idx]["income"] = float(total)
        else:
            result[idx]["expenses"] = float(total)

    # Calcular balance
    for item in result:
        item["balance"] = item["income"] - item["expenses"]

    return result


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

    # Verificar si fue compartido (buscar Expense con este personal_expense_id)
    from app.models.database import Expense
    shared_expense = db.query(Expense).filter(
        Expense.personal_expense_id == expense.id
    ).first()
    
    if shared_expense:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este gasto fue compartido. Descompártelo primero desde la vivienda.",
        )

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}
