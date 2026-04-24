from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from app.models.database import get_db, User, Category, household_members, household_categories
from app.schemas.schemas import CategoryCreate, CategoryResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=List[CategoryResponse])
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get household IDs for the current user
    household_ids = [h.id for h in current_user.households]

    query = db.query(Category).distinct().outerjoin(
        household_categories,
        Category.id == household_categories.c.category_id,
    ).filter(
        or_(
            Category.is_default == True,
            Category.created_by == current_user.id,
            household_categories.c.household_id.in_(household_ids) if household_ids else False,
        )
    )

    return query.all()


@router.post("/", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Categories are now global (not tied to any household)
    category = Category(
        name=category_data.name,
        icon=category_data.icon,
        is_default=False,
        household_id=None,
        created_by=current_user.id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category = db.query(Category).filter(Category.id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if category.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit default categories",
        )

    if category.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this category",
        )

    category.name = category_data.name
    category.icon = category_data.icon

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    category = db.query(Category).filter(Category.id == category_id).first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if category.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default categories",
        )

    if category.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this category",
        )

    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}
