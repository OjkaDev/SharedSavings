from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.database import Household, Expense, ExpenseSplit


def get_household_or_403(household_id: int, current_user, db: Session) -> Household:
    """Validate household exists and user is a member."""
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Household not found",
        )
    if current_user not in household.members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this household",
        )
    return household


def create_expense_splits(db: Session, expense_id: int, amount: float,
                          split_type: str, splits, members, payer_id: int):
    """Create ExpenseSplit records for equal or percentage splits."""
    if split_type == "equal":
        split_amount = amount / len(members)
        for member in members:
            db.add(ExpenseSplit(
                expense_id=expense_id,
                user_id=member.id,
                amount=split_amount,
                percentage=100 / len(members),
                paid=(member.id == payer_id),
            ))
    elif split_type == "percentage" and splits:
        for s in splits:
            db.add(ExpenseSplit(
                expense_id=expense_id,
                user_id=s.user_id,
                amount=(amount * s.percentage) / 100,
                percentage=s.percentage,
                paid=(s.user_id == payer_id),
            ))


def get_shared_expense_info(db: Session, personal_expense_id: int, user_id: int):
    """Check if a personal expense was shared and get the split for the user."""
    shared = db.query(Expense).filter(Expense.personal_expense_id == personal_expense_id).first()
    if not shared:
        return None, None
    split = db.query(ExpenseSplit).filter(
        ExpenseSplit.expense_id == shared.id,
        ExpenseSplit.user_id == user_id,
    ).first()
    return shared, split


def apply_date_filters(query, model, start_date=None, end_date=None):
    """Apply optional date range filters to a query."""
    if start_date:
        query = query.filter(model.date >= start_date)
    if end_date:
        query = query.filter(model.date <= end_date)
    return query
