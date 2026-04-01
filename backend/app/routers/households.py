from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db, User, Household, household_members, Category
from app.schemas.schemas import (
    HouseholdCreate,
    HouseholdResponse,
    InviteMember,
)
from app.utils.auth import get_current_user
from app.config import DEFAULT_CATEGORIES

router = APIRouter(prefix="/households", tags=["Households"])


@router.get("/", response_model=List[HouseholdResponse])
def get_households(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return current_user.households


@router.post("/", response_model=HouseholdResponse)
def create_household(
    household_data: HouseholdCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    household = Household(
        name=household_data.name,
        created_by=current_user.id,
    )
    db.add(household)
    db.commit()
    db.refresh(household)

    # Add creator as owner
    stmt = household_members.insert().values(
        user_id=current_user.id,
        household_id=household.id,
        role="owner",
    )
    db.execute(stmt)

    # Create default categories for this household
    for cat_data in DEFAULT_CATEGORIES:
        category = Category(
            name=cat_data["name"],
            icon=cat_data["icon"],
            is_default=True,
            household_id=household.id,
            created_by=current_user.id,
        )
        db.add(category)

    db.commit()
    db.refresh(household)
    return household


@router.get("/{household_id}", response_model=HouseholdResponse)
def get_household(
    household_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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


@router.delete("/{household_id}")
def delete_household(
    household_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Household not found",
        )

    if household.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can delete this household",
        )

    db.delete(household)
    db.commit()
    return {"message": "Household deleted successfully"}


@router.post("/{household_id}/invite")
def invite_member(
    household_id: int,
    invite_data: InviteMember,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    user_to_invite = db.query(User).filter(User.email == invite_data.email).first()
    if not user_to_invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found",
        )

    if user_to_invite in household.members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member",
        )

    stmt = household_members.insert().values(
        user_id=user_to_invite.id,
        household_id=household.id,
        role="member",
    )
    db.execute(stmt)
    db.commit()

    return {"message": f"User {invite_data.email} invited successfully"}
