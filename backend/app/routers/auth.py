from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.database import get_db, User
from app.schemas.schemas import UserResponse, PasswordChange, SyncUserRequest
from app.utils.auth import (
    verify_password,
    get_password_hash,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/sync", response_model=UserResponse)
def sync_user(user_data: SyncUserRequest, db: Session = Depends(get_db)):
    """Sync user from Supabase Auth to local database."""
    # Check if user already exists by supabase_uid
    existing_user = db.query(User).filter(User.supabase_uid == user_data.supabase_uid).first()
    if existing_user:
        # Update user info if needed
        existing_user.email = user_data.email
        existing_user.name = user_data.name
        db.commit()
        db.refresh(existing_user)
        return existing_user

    # Check if email already exists (legacy user)
    email_user = db.query(User).filter(User.email == user_data.email).first()
    if email_user:
        # Link supabase_uid to existing user
        email_user.supabase_uid = user_data.supabase_uid
        email_user.name = user_data.name
        db.commit()
        db.refresh(email_user)
        return email_user

    # Create new user
    user = User(
        supabase_uid=user_data.supabase_uid,
        email=user_data.email,
        name=user_data.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name = name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password change not available for Supabase Auth users. Use Supabase password reset.",
        )

    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
