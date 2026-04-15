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
    shared_expense_id: Optional[int] = None
    created_at: datetime
    category: Optional[CategoryResponse]
    my_share: Optional[float] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_shared(cls, obj):
        data = {
            "id": obj.id,
            "user_id": obj.user_id,
            "amount": obj.amount,
            "description": obj.description,
            "category_id": obj.category_id,
            "date": obj.date,
            "type": obj.type,
            "created_at": obj.created_at,
            "category": obj.category,
            "shared_expense_id": None,
        }
        if hasattr(obj, 'shared_expense') and obj.shared_expense:
            data["shared_expense_id"] = obj.shared_expense.id
        return cls(**data)


class PersonalSummary(BaseModel):
    income: float
    expenses: float
    balance: float
    by_category: List[dict] = []


# Share expenses schemas
class ShareExpenseSplit(BaseModel):
    user_id: int
    percentage: float


class ShareExpenseItem(BaseModel):
    expense_id: int
    split_type: str = "equal"
    splits: Optional[List[ShareExpenseSplit]] = []


class ShareExpensesRequest(BaseModel):
    household_id: int
    expenses: List[ShareExpenseItem]


class ShareExpensesResponse(BaseModel):
    shared: int
    total: float
    message: str


# Debt schemas
class DebtDetail(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    amount_owed: float  # Lo que te deben (positivo) o debes (negativo)
    splits: List[dict] = []


class DebtSummary(BaseModel):
    you_owe: float  # Total que debes
    you_are_owed: float  # Total que te deben
    balance: float  # Balance neto
    debts: List[DebtDetail] = []


# Monthly data schemas
class MonthlyPersonalData(BaseModel):
    month: int
    income: float
    expenses: float
    balance: float


class MonthlySharedData(BaseModel):
    month: int
    total: float
    my_share: float
