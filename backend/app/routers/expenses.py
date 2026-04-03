from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.models.database import get_db, User, Expense, ExpenseSplit, Category, household_members, PersonalExpense
from app.schemas.schemas import ExpenseCreate, ExpenseResponse, ExpenseSummary, ShareExpensesRequest, ShareExpensesResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("/", response_model=List[ExpenseResponse])
def get_expenses(
    household_id: int = None,
    category_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Expense)
        .join(household_members, Expense.household_id == household_members.c.household_id)
        .filter(household_members.c.user_id == current_user.id)
    )

    if household_id:
        query = query.filter(Expense.household_id == household_id)
    if category_id:
        query = query.filter(Expense.category_id == category_id)

    return query.order_by(Expense.date.desc()).all()


@router.get("/summary", response_model=ExpenseSummary)
def get_expense_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    household_ids = [h.id for h in current_user.households]

    if not household_ids:
        return ExpenseSummary(total=0, pending=0, by_category=[])

    total = (
        db.query(func.sum(Expense.amount))
        .filter(Expense.household_id.in_(household_ids))
        .scalar()
        or 0
    )

    pending = (
        db.query(func.sum(ExpenseSplit.amount))
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .filter(
            Expense.household_id.in_(household_ids),
            ExpenseSplit.user_id == current_user.id,
            ExpenseSplit.paid == False,
            Expense.paid_by != current_user.id,
        )
        .scalar()
        or 0
    )

    category_totals = (
        db.query(Category.name, func.sum(Expense.amount))
        .join(Expense, Expense.category_id == Category.id)
        .filter(Expense.household_id.in_(household_ids))
        .group_by(Category.name)
        .all()
    )

    by_category = [{"name": name, "total": total} for name, total in category_totals]

    return ExpenseSummary(total=float(total), pending=float(pending), by_category=by_category)


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_member = (
        db.query(household_members)
        .filter(
            household_members.c.user_id == current_user.id,
            household_members.c.household_id == expense_data.household_id,
        )
        .first()
    )

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this household",
        )

    expense = Expense(
        household_id=expense_data.household_id,
        paid_by=current_user.id,
        amount=expense_data.amount,
        description=expense_data.description,
        category_id=expense_data.category_id,
        date=expense_data.date,
        split_type=expense_data.split_type,
    )
    db.add(expense)
    db.flush()

    members = (
        db.query(User)
        .join(household_members, User.id == household_members.c.user_id)
        .filter(household_members.c.household_id == expense_data.household_id)
        .all()
    )

    if expense_data.split_type == "equal":
        split_amount = expense_data.amount / len(members)
        for member in members:
            split = ExpenseSplit(
                expense_id=expense.id,
                user_id=member.id,
                amount=split_amount,
                percentage=100 / len(members),
                paid=(member.id == current_user.id),
            )
            db.add(split)
    elif expense_data.split_type == "percentage" and expense_data.splits:
        for split_data in expense_data.splits:
            amount = (expense_data.amount * split_data.percentage) / 100
            split = ExpenseSplit(
                expense_id=expense.id,
                user_id=split_data.user_id,
                amount=amount,
                percentage=split_data.percentage,
                paid=(split_data.user_id == current_user.id),
            )
            db.add(split)

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    if expense.paid_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payer can delete this expense",
        )

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}


@router.post("/share", response_model=ShareExpensesResponse)
def share_expenses_to_household(
    share_data: ShareExpensesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compartir gastos personales a una vivienda"""
    # Verificar que el usuario es miembro de la vivienda
    is_member = (
        db.query(household_members)
        .filter(
            household_members.c.user_id == current_user.id,
            household_members.c.household_id == share_data.household_id,
        )
        .first()
    )

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this household",
        )

    # Obtener miembros de la vivienda
    members = (
        db.query(User)
        .join(household_members, User.id == household_members.c.user_id)
        .filter(household_members.c.household_id == share_data.household_id)
        .all()
    )

    if len(members) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Need at least 2 members to share expenses",
        )

    shared_count = 0
    total_amount = 0.0

    for expense_item in share_data.expenses:
        # Obtener el gasto personal
        personal_expense = (
            db.query(PersonalExpense)
            .filter(
                PersonalExpense.id == expense_item.expense_id,
                PersonalExpense.user_id == current_user.id,
            )
            .first()
        )

        if not personal_expense:
            continue

        # Crear el gasto compartido
        expense = Expense(
            household_id=share_data.household_id,
            paid_by=current_user.id,
            amount=personal_expense.amount,
            description=personal_expense.description,
            category_id=personal_expense.category_id,
            date=personal_expense.date,
            split_type=expense_item.split_type,
        )
        db.add(expense)
        db.flush()

        # Crear los splits
        if expense_item.split_type == "equal":
            split_amount = personal_expense.amount / len(members)
            for member in members:
                split = ExpenseSplit(
                    expense_id=expense.id,
                    user_id=member.id,
                    amount=split_amount,
                    percentage=100 / len(members),
                    paid=(member.id == current_user.id),
                )
                db.add(split)
        elif expense_item.split_type == "percentage" and expense_item.splits:
            for split_data in expense_item.splits:
                amount = (personal_expense.amount * split_data.percentage) / 100
                split = ExpenseSplit(
                    expense_id=expense.id,
                    user_id=split_data.user_id,
                    amount=amount,
                    percentage=split_data.percentage,
                    paid=(split_data.user_id == current_user.id),
                )
                db.add(split)

        shared_count += 1
        total_amount += personal_expense.amount

    db.commit()

    return ShareExpensesResponse(
        shared=shared_count,
        total=total_amount,
        message=f"{shared_count} gastos compartidos correctamente",
    )
