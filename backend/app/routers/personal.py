from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract, or_
from typing import List, Optional
from datetime import datetime
from app.models.database import get_db, User, PersonalExpense, Category, Expense, ExpenseSplit, household_members, household_categories
from app.schemas.schemas import PersonalExpenseCreate, PersonalExpenseResponse, PersonalSummary, MonthlyPersonalData, TopExpense
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
    from app.models.database import Category
    
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
        is_shared_by_me = False
        if shared_expense_id:
            split = db.query(ExpenseSplit).filter(
                ExpenseSplit.expense_id == shared_expense_id,
                ExpenseSplit.user_id == current_user.id,
            ).first()
            my_share = split.amount if split else None
            is_shared_by_me = True
        
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
            "is_shared_by_me": is_shared_by_me,
            "is_debt": False,
        }
        result.append(exp_dict)
    
    # Obtener gastos de otros donde debo dinero
    debt_filters = [
        ExpenseSplit.user_id == current_user.id,
        Expense.paid_by != current_user.id,
    ]
    if start_date:
        debt_filters.append(Expense.date >= start_date)
    if end_date:
        debt_filters.append(Expense.date <= end_date)
    
    debts = (
        db.query(ExpenseSplit)
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .join(Category, Expense.category_id == Category.id, isouter=True)
        .filter(*debt_filters)
        .all()
    )
    
    for debt in debts:
        exp_dict = {
            "id": -debt.expense.id,
            "user_id": debt.expense.paid_by,
            "amount": debt.amount,
            "description": debt.expense.description,
            "category_id": debt.expense.category_id,
            "date": debt.expense.date,
            "type": "expense",
            "created_at": debt.expense.created_at,
            "category": debt.expense.category,
            "shared_expense_id": debt.expense.id,
            "my_share": debt.amount,
            "is_shared_by_me": False,
            "is_debt": True,
            "is_paid": debt.paid,
        }
        result.append(exp_dict)
    
    # Ordenar por fecha descendente
    result.sort(key=lambda x: x["date"], reverse=True)
    
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

    # Gastos personales
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

    # Agregar deudas de otros (gastos compartidos por otros en mis viviendas)
    # Solo categorías accesibles: default o asociadas a mis viviendas
    household_ids = [h.id for h in current_user.households]

    debt_cat_query = (
        db.query(Category.name, func.sum(ExpenseSplit.amount))
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .join(Category, Expense.category_id == Category.id)
        .join(household_members, Expense.household_id == household_members.c.household_id)
        .outerjoin(
            household_categories,
            (Category.id == household_categories.c.category_id)
            & (household_categories.c.household_id.in_(household_ids)),
        )
        .filter(
            household_members.c.user_id == current_user.id,
            ExpenseSplit.user_id == current_user.id,
            Expense.paid_by != current_user.id,
            ExpenseSplit.paid == False,
            or_(
                Category.is_default == True,
                household_categories.c.household_id.isnot(None),
            ),
        )
    )
    if start_date:
        debt_cat_query = debt_cat_query.filter(Expense.date >= start_date)
    if end_date:
        debt_cat_query = debt_cat_query.filter(Expense.date <= end_date)

    for cat_name, total in debt_cat_query.group_by(Category.name).all():
        name = cat_name or "Sin categoría"
        by_category_dict[name] = by_category_dict.get(name, 0) + float(total)

    by_category = [{"name": name, "total": float(total)} for name, total in by_category_dict.items()]

    # Agregar deudas no pagadas al total de gastos
    debt_total = (
        db.query(func.sum(ExpenseSplit.amount))
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .filter(
            ExpenseSplit.user_id == current_user.id,
            Expense.paid_by != current_user.id,
            ExpenseSplit.paid == False,
        )
        .scalar()
        or 0
    )
    total_expenses_with_debts = float(personal_only_expenses) + float(debt_total)

    return PersonalSummary(
        income=float(income),
        expenses=total_expenses_with_debts,
        balance=float(income) - total_expenses_with_debts,
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

    # Agregar deudas de otros (gastos compartidos por otros en mis viviendas)
    monthly_debts = (
        db.query(
            extract('month', Expense.date).label('month'),
            func.sum(ExpenseSplit.amount).label('total'),
        )
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .join(household_members, Expense.household_id == household_members.c.household_id)
        .filter(
            household_members.c.user_id == current_user.id,
            ExpenseSplit.user_id == current_user.id,
            Expense.paid_by != current_user.id,
            ExpenseSplit.paid == False,
            extract('year', Expense.date) == year,
        )
        .group_by('month')
        .all()
    )

    for month_num, debt_total in monthly_debts:
        idx = int(month_num) - 1
        result[idx]["expenses"] += float(debt_total)

    # Calcular balance
    for item in result:
        item["balance"] = item["income"] - item["expenses"]

    return result


@router.get("/top-expenses", response_model=List[TopExpense])
def get_top_expenses(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener los gastos más grandes del periodo (personales + deudas de otros)"""
    results = []

    # Gastos personales
    personal_query = (
        db.query(PersonalExpense)
        .options(joinedload(PersonalExpense.category))
        .filter(
            PersonalExpense.user_id == current_user.id,
            PersonalExpense.type == "expense",
        )
    )
    if start_date:
        personal_query = personal_query.filter(PersonalExpense.date >= start_date)
    if end_date:
        personal_query = personal_query.filter(PersonalExpense.date <= end_date)

    for exp in personal_query.all():
        shared = db.query(Expense).filter(Expense.personal_expense_id == exp.id).first()
        if shared:
            split = db.query(ExpenseSplit).filter(
                ExpenseSplit.expense_id == shared.id,
                ExpenseSplit.user_id == current_user.id,
            ).first()
            amount = split.amount if split else exp.amount
        else:
            amount = exp.amount

        results.append({
            "description": exp.description or "Sin descripción",
            "amount": amount,
            "category_name": exp.category.name if exp.category else "Sin categoría",
            "date": exp.date,
            "type": "personal",
        })

    # Deudas de otros
    debt_query = (
        db.query(ExpenseSplit, Expense, Category)
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .join(Category, Expense.category_id == Category.id, isouter=True)
        .join(household_members, Expense.household_id == household_members.c.household_id)
        .filter(
            household_members.c.user_id == current_user.id,
            ExpenseSplit.user_id == current_user.id,
            Expense.paid_by != current_user.id,
            ExpenseSplit.paid == False,
        )
    )
    if start_date:
        debt_query = debt_query.filter(Expense.date >= start_date)
    if end_date:
        debt_query = debt_query.filter(Expense.date <= end_date)

    for split, expense, category in debt_query.all():
        results.append({
            "description": expense.description or "Sin descripción",
            "amount": split.amount,
            "category_name": category.name if category else "Sin categoría",
            "date": expense.date,
            "type": "debt",
        })

    # Ordenar por monto descendente y limitar
    results.sort(key=lambda x: x["amount"], reverse=True)
    return results[:limit]


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
