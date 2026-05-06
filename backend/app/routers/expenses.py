from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime
from app.models.database import get_db, User, Expense, ExpenseSplit, Category, household_members, household_categories, PersonalExpense
from app.schemas.schemas import ExpenseCreate, ExpenseResponse, ExpenseSummary, ShareExpensesRequest, ShareExpensesResponse, MonthlySharedData
from app.utils.auth import get_current_user
from app.utils.helpers import get_household_or_403, get_or_404, init_monthly_buckets, create_expense_splits, apply_date_filters

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("/", response_model=List[ExpenseResponse])
def get_expenses(
    household_id: Optional[int] = None,
    category_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
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
    query = apply_date_filters(query, Expense, start_date, end_date)

    return query.order_by(Expense.date.desc()).all()


@router.get("/summary", response_model=ExpenseSummary)
def get_expense_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    household_ids = [h.id for h in current_user.households]

    if not household_ids:
        return ExpenseSummary(total=0, pending=0, by_category=[])

    total_query = apply_date_filters(
        db.query(func.sum(Expense.amount)).filter(Expense.household_id.in_(household_ids)),
        Expense, start_date, end_date,
    )
    total = total_query.scalar() or 0

    pending_query = apply_date_filters(
        db.query(func.sum(ExpenseSplit.amount))
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .filter(
            Expense.household_id.in_(household_ids),
            ExpenseSplit.user_id == current_user.id,
            ExpenseSplit.paid == False,
            Expense.paid_by != current_user.id,
        ),
        Expense, start_date, end_date,
    )
    pending = pending_query.scalar() or 0

    category_query = apply_date_filters(
        db.query(Category.name, func.sum(Expense.amount))
        .join(Expense, Expense.category_id == Category.id)
        .filter(Expense.household_id.in_(household_ids)),
        Expense, start_date, end_date,
    )
    category_totals = category_query.group_by(Category.name).all()

    by_category = [{"name": name, "total": total} for name, total in category_totals]

    return ExpenseSummary(total=float(total), pending=float(pending), by_category=by_category)


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    household = get_household_or_403(expense_data.household_id, current_user, db)

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

    members = household.members

    create_expense_splits(
        db, expense.id, expense_data.amount,
        expense_data.split_type, expense_data.splits, members, current_user.id,
    )

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = get_or_404(db, Expense, expense_id, "Expense not found")

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
    household = get_household_or_403(share_data.household_id, current_user, db)
    members = household.members

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

        # Verificar que no haya sido compartido ya (buscar Expense existente)
        existing_shared = db.query(Expense).filter(
            Expense.personal_expense_id == personal_expense.id
        ).first()
        if existing_shared:
            continue

        # Crear el gasto compartido
        # Asociar categoría custom a la vivienda si no está asociada
        if personal_expense.category_id:
            category = db.query(Category).filter(Category.id == personal_expense.category_id).first()
            if category and not category.is_default:
                existing_link = db.query(household_categories).filter(
                    household_categories.c.household_id == share_data.household_id,
                    household_categories.c.category_id == category.id,
                ).first()
                if not existing_link:
                    db.execute(household_categories.insert().values(
                        household_id=share_data.household_id,
                        category_id=category.id,
                    ))

        expense = Expense(
            household_id=share_data.household_id,
            paid_by=current_user.id,
            amount=personal_expense.amount,
            description=personal_expense.description,
            category_id=personal_expense.category_id,
            date=personal_expense.date,
            split_type=expense_item.split_type,
            personal_expense_id=personal_expense.id,
        )
        db.add(expense)
        db.flush()

        # Crear los splits
        create_expense_splits(
            db, expense.id, personal_expense.amount,
            expense_item.split_type, expense_item.splits, members, current_user.id,
        )

        shared_count += 1
        total_amount += personal_expense.amount

    db.commit()

    return ShareExpensesResponse(
        shared=shared_count,
        total=total_amount,
        message=f"{shared_count} gastos compartidos correctamente",
    )


@router.delete("/{expense_id}/unshare")
def unshare_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Descompartir un gasto (eliminar gasto compartido)"""
    expense = get_or_404(db, Expense, expense_id, "Expense not found")

    # Solo el que compartió puede descompartir
    if expense.paid_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the payer can unshare this expense",
        )

    # Eliminar gasto compartido
    db.delete(expense)
    db.commit()

    return {"message": "Gasto descompartido correctamente"}


@router.get("/monthly", response_model=List[MonthlySharedData])
def get_monthly_shared(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener desglose mensual de gastos compartidos"""
    if not year:
        year = datetime.utcnow().year

    # Total de gastos compartidos por mes
    monthly_total = (
        db.query(
            extract('month', Expense.date).label('month'),
            func.sum(Expense.amount).label('total'),
        )
        .join(household_members, Expense.household_id == household_members.c.household_id)
        .filter(
            household_members.c.user_id == current_user.id,
            extract('year', Expense.date) == year,
        )
        .group_by('month')
        .all()
    )

    # Mi parte de los gastos compartidos por mes
    monthly_share = (
        db.query(
            extract('month', Expense.date).label('month'),
            func.sum(ExpenseSplit.amount).label('my_share'),
        )
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .join(household_members, Expense.household_id == household_members.c.household_id)
        .filter(
            household_members.c.user_id == current_user.id,
            ExpenseSplit.user_id == current_user.id,
            extract('year', Expense.date) == year,
        )
        .group_by('month')
        .all()
    )

    result = init_monthly_buckets({"total": 0.0, "my_share": 0.0})

    # Rellenar totales
    for month_num, total in monthly_total:
        idx = int(month_num) - 1
        result[idx]["total"] = float(total)

    # Rellenar mi parte
    for month_num, share in monthly_share:
        idx = int(month_num) - 1
        result[idx]["my_share"] = float(share)

    return result
