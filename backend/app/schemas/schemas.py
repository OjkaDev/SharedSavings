from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# Household schemas
class HouseholdCreate(BaseModel):
    name: str


class HouseholdMemberResponse(BaseModel):
    id: int
    name: Optional[str]
    email: str

    class Config:
        from_attributes = True


class HouseholdResponse(BaseModel):
    id: int
    name: str
    created_by: int
    created_at: datetime
    members: List[HouseholdMemberResponse] = []

    class Config:
        from_attributes = True


class InviteMember(BaseModel):
    email: EmailStr


# Category schemas
class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "💰"


class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: Optional[str]
    is_default: bool
    household_id: Optional[int]

    class Config:
        from_attributes = True


# Expense schemas
class ExpenseSplitCreate(BaseModel):
    user_id: int
    amount: Optional[float] = None
    percentage: Optional[float] = None


class ExpenseCreate(BaseModel):
    household_id: int
    amount: float
    description: Optional[str] = None
    category_id: Optional[int] = None
    date: datetime
    split_type: str = "equal"
    splits: Optional[List[ExpenseSplitCreate]] = []


class ExpenseSplitResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    percentage: Optional[float]
    paid: bool
    user: HouseholdMemberResponse

    class Config:
        from_attributes = True


class ExpenseResponse(BaseModel):
    id: int
    household_id: int
    paid_by: int
    amount: float
    description: Optional[str]
    category_id: Optional[int]
    date: datetime
    split_type: str
    created_at: datetime
    paid_by_user: Optional[HouseholdMemberResponse]
    category: Optional[CategoryResponse]
    splits: List[ExpenseSplitResponse] = []

    class Config:
        from_attributes = True


class ExpenseSummary(BaseModel):
    total: float
    pending: float
    by_category: List[dict] = []


# Personal expense schemas
class PersonalExpenseCreate(BaseModel):
    amount: float
    description: Optional[str] = None
    category_id: Optional[int] = None
    date: datetime
    type: str = "expense"


class PersonalExpenseResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    description: Optional[str]
    category_id: Optional[int]
    date: datetime
    type: str
    created_at: datetime
    category: Optional[CategoryResponse]

    class Config:
        from_attributes = True


class PersonalSummary(BaseModel):
    income: float
    expenses: float
    balance: float
    by_category: List[dict] = []
