# AGENTS.md — SharedSavings Project Guide

> Comprehensive reference for any agent working on this codebase. Read this first to understand the project.

---

## Project Overview

**Name:** SharedSavings  
**Description:** Web application for sharing household expenses and managing personal finances  
**Stack:**
| Layer | Technology | Deployment |
|-------|------------|------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 + Chart.js + Axios | Vercel |
| Backend | FastAPI + SQLAlchemy + PostgreSQL (Supabase) | Render |
| Auth | JWT (HS256, 30-day expiry, python-jose + passlib/bcrypt) | — |

**Run the app:**
```bash
# Frontend (port 5173)
cd frontend && npm run dev

# Backend (port 8000)
cd backend && .\venv\Scripts\activate && uvicorn app.main:app --reload
```

---

## Directory Structure

```
Proyecto-Cuenta/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, mounts routers, creates tables
│   │   ├── config.py          # Env vars + DEFAULT_CATEGORIES
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── database.py  # 7 SQLAlchemy tables + SessionLocal + get_db()
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py   # All Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py      # POST /register, /login; GET /me; PUT /profile, /password
│   │   │   ├── households.py  # CRUD + invite + debts + pay-all
│   │   │   ├── expenses.py    # CRUD + summary + share/unshare + monthly
│   │   │   ├── personal.py    # CRUD personal expenses + summary + monthly + debts
│   │   │   └── categories.py  # CRUD (default categories protected)
│   │   ├── services/        # EMPTY — business logic in routers
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── auth.py      # JWT create/verify + get_current_user
│   ├── requirements.txt
│   └── .env               # SUPABASE_URL, SUPABASE_KEY, SECRET_KEY, DATABASE_URL
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # Entry: BrowserRouter + AuthProvider + <App/>
│   │   ├── App.jsx         # Routes (React Router)
│   │   ├── index.css       # Tailwind v4 + custom utilities (btn-primary, btn-secondary, input-field, card, badge)
│   │   ├── components/
│   │   │   ├── Layout.jsx            # Shell: navbar + <Outlet/>
│   │   │   ├── ProtectedRoute.jsx   # Redirects to /login if no user
│   │   │   ├── CreateHouseholdModal.jsx
│   │   │   ├── HouseholdCard.jsx
│   │   │   ├── InviteMemberModal.jsx
│   │   │   ├── ShareToHouseholdModal.jsx  # 2-step: pick household, configure splits
│   │   │   └── DateFilter.jsx         # Shared month/year filter
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Login form
│   │   │   ├── Register.jsx       # Registration form
│   │   │   ├── Dashboard.jsx     # Stats with real data
│   │   │   ├── Household.jsx      # List/create/delete households
│   │   │   ├── HouseholdDetail.jsx # Debts + shared expenses
│   │   │   ├── PersonalFinances.jsx # CRUD + share to household
│   │   │   ├── Settings.jsx        # Profile, password, categories
│   │   │   └── Reports.jsx        # 5 Chart.js graphs
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # {user, loading, login, register, logout}
│   │   ├── services/
│   │   │   └── api.js         # Axios + auth interceptor + 401 redirect
│   │   └── utils/
│   │       └── dateUtils.js   # getMonthRange, getCurrentMonth, MONTHS
│   ├── package.json
│   ├── vite.config.js      # Proxy /api -> localhost:8000
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── PLAN.md
├── README.md
└── AGENTS.md  # This file
```

---

## Database Models (7 tables)

```
users (1) <--M--> household_members (M) <--M--> (1) households
  |                                                |
  |--> (M) personal_expenses                          |--> (M) expenses
  |--> (M) expense_splits                             |      |
  |--> (M) expenses (paid_by)                        |      |--> (M) expense_splits
                                                      |
                                                      |--> (M) categories
                                                      |--> (M) household_categories (N:M)
```

| Model | Key Columns | Notes |
|-------|-----------|-------|
| **User** | id, email(unique), name, password_hash | M2M households, 1:N personal_expenses, 1:N expenses_paid, 1:N expense_splits |
| **Household** | id, name, created_by(FK->users) | 1:N expenses (cascade delete), M2M members, M2M categories |
| **household_members** | user_id, household_id, role("owner"/"member"), joined_at | Association table |
| **household_categories** | id, household_id, category_id (unique constraint) | Junction table: links custom categories to households for visibility |
| **Category** | id, name, icon, is_default, household_id, created_by | Default (global, all users see); Custom (owner only, unless linked via household_categories) |
| **Expense** | id, household_id, paid_by, amount, description, category_id, date, split_type("equal"/"percentage"), personal_expense_id | Links to PersonalExpense |
| **ExpenseSplit** | id, expense_id, user_id, amount, percentage, paid | Who owes what + payment status |
| **PersonalExpense** | id, user_id, amount, description, category_id, date, type("expense"/"income") | Personal transactions |

**Category visibility rules:**
- Default (`is_default=True`): visible to all users
- Custom (`created_by=user_id`): visible only to creator
- Custom + linked to household (`household_categories`): visible to all household members

**Auto-create:** `Base.metadata.create_all()` runs on every startup (main.py:9). Default global categories are seeded once at startup (main.py:12-36).

---

## API Endpoints

### Public (2)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/health` | `{"status": "healthy"}` |

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create user + JWT |
| POST | `/api/auth/login` | No | Login + JWT |
| GET | `/api/auth/me` | Yes | Current user profile |
| PUT | `/api/auth/profile` | Yes | Update name (query param) |
| PUT | `/api/auth/password` | Yes | Change password |

### Households (`/api/households`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/households/` | Yes | List user's households |
| POST | `/api/households/` | Yes | Create household |
| GET | `/api/households/{id}` | Yes | Get household + members |
| DELETE | `/api/households/{id}` | Yes | Delete (creator only) |
| POST | `/api/households/{id}/invite` | Yes | Invite by email |
| GET | `/api/households/{id}/debts` | Yes | Debt summary |
| PUT | `/api/households/{id}/pay-all` | Yes | Mark all unpaid as paid |

### Expenses (`/api/expenses`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/expenses/` | Yes | List (filters: household_id, category_id, start_date, end_date) |
| GET | `/api/expenses/summary` | Yes | Total + pending + by_category |
| GET | `/api/expenses/monthly` | Yes | Monthly breakdown |
| POST | `/api/expenses/` | Yes | Create shared expense |
| DELETE | `/api/expenses/{id}` | Yes | Delete (payer only) |
| POST | `/api/expenses/share` | Yes | Bulk share to household |
| DELETE | `/api/expenses/{id}/unshare` | Yes | Unshare, keep personal |

### Personal (`/api/personal`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/personal/expenses` | Yes | List + debts from others (includes is_debt, is_paid) |
| GET | `/api/personal/summary` | Yes | Income/expenses/balance (includes debts by category with visibility rules) |
| GET | `/api/personal/monthly` | Yes | Monthly income/expenses |
| POST | `/api/personal/expenses` | Yes | Create income or expense |
| DELETE | `/api/personal/expenses/{id}` | Yes | Delete (blocked if shared) |

### Categories (`/api/categories`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/categories/` | Yes | List (default + user's own + household-linked) |
| POST | `/api/categories/` | Yes | Create global category |
| PUT | `/api/categories/{id}` | Yes | Update (owner only) |
| DELETE | `/api/categories/{id}` | Yes | Delete (owner only) |

**Note:** Default categories are global (created once at startup). All users can see them. Custom categories belong to the user who created them, but are auto-linked to the household when sharing an expense (via `household_categories` junction table).

---

## Frontend Routing

| Path | Component | Protected | Status |
|------|-----------|-----------|--------|
| `/login` | Login | No | ✅ |
| `/register` | Register | No | ✅ |
| `/` | Dashboard | Yes | ✅ Real data |
| `/personal` | PersonalFinances | Yes | ✅ + debts display |
| `/household` | Household | Yes | ✅ |
| `/household/:id` | HouseholdDetail | Yes | ✅ + date filter |
| `/reports` | Reports | Yes | ✅ 5 charts |
| `/settings` | Settings | Yes | ✅ profile + categories |

---

## Key Data Flows

### Auth Flow
1. Login/Register → POST to API → stores JWT in localStorage
2. `api.js` interceptor adds `Authorization: Bearer <token>`
3. `AuthContext.checkAuth()` validates token via `/auth/me`
4. 401 → clears token → redirects to `/login`

### Share Personal Expense
1. Select transactions in PersonalFinances (checkboxes)
2. Open ShareToHouseholdModal → pick household → configure split
3. POST `/api/expenses/share` → creates Expense + ExpenseSplit
4. If category is custom, auto-links it to household via `household_categories`
5. Shared transactions show badge with split info

### Debt Calculation
- Debts from `ExpenseSplit.paid` status
- `GET /households/{id}/debts` returns you_owe, you_are_owed, balance

### Personal Finances Display
The `/personal/expenses` endpoint returns a unified list:
- **Personal expenses**: type="expense" or "income"
- **Shared by me**: is_shared_by_me=True, shows my_share
- **Debts from others**: is_debt=True, is_paid=False (orange), is_paid=True (purple/red)

---

## Pydantic Schemas

| Schema | Key Fields |
|--------|------------|
| UserCreate | email, password, name? |
| UserLogin | email, password |
| UserResponse | id, email, name, created_at |
| Token | access_token, token_type |
| HouseholdCreate | name |
| HouseholdResponse | id, name, created_by, members[] |
| CategoryCreate | name, icon? |
| CategoryResponse | id, name, icon, is_default, household_id |
| ExpenseCreate | household_id, amount, description?, category_id?, date, split_type, splits[] |
| ExpenseResponse | id, household_id, paid_by, amount, ..., splits[] |
| PersonalExpenseCreate | amount, description?, category_id?, date, type("expense") |
| PersonalExpenseResponse | id, user_id, amount, ..., shared_expense_id?, my_share?, is_shared_by_me?, is_debt?, is_paid? |
| PersonalSummary | income, expenses, balance, by_category |
| MonthlyPersonalData | month, income, expenses, balance |
| MonthlySharedData | month, total, my_share |
| DebtDetail | user_id, user_name, user_email, amount_owed, splits[] |
| DebtSummary | you_owe, you_are_owed, balance, debts[] |
| ShareExpensesRequest | household_id, expenses[{expense_id, split_type, splits[]}] |
| ShareExpensesResponse | shared, total, message |

---

## Development Status

**Completed:**
- Full auth system (register, login, JWT, profile, password change)
- Household CRUD + invite members
- Personal finances CRUD (income/expense)
- Share expenses to household with split config
- Household detail with debt summary
- Settings page with sidebar navigation (Perfil, Categorías)
- Profile + Password unified in one section
- Date filters on PersonalFinances, HouseholdDetail, Reports
- Reports page with 5 Chart.js graphs
- Dashboard with real data from current month
- Unified year selector in Reports (DateFilter)
- PersonalFinances shows my_share for shared expenses
- Personal summary calculates proportional share
- PersonalFinances shows debts from others (is_debt, is_paid)
- Debts included in summary total
- Protected actions for others' expenses
- **Categories redesign:** Global default categories (visible to all users) + user custom categories
- Emoji suggestions panel in Settings (click outside to close)
- Responsive UI improvements for mobile
- Reports page redesigned with dark theme matching Dashboard + mobile responsive
- Household categories junction table (`household_categories`) for custom category visibility in shared expenses
- Auto-link custom categories to household when sharing expenses
- Reports by_category includes shared expense debts with proper visibility rules

**Pending:**
- Database review and security
- Deployment to Vercel + Render

---

## Gotchas & Design Notes

1. **No services layer** — Business logic in router files
2. **No migrations** — Tables auto-created on startup (not production-ready)
3. **No refresh tokens** — 30-day JWT expiry, then re-login
4. **No pagination** — All endpoints return everything
5. **No expense updates** — Create/delete only
6. **Profile update uses query param** — `PUT /api/auth/profile?name=foo`
7. **Default categories** — 7 Spanish categories, global (created once at startup), visible to all users
8. **Custom category visibility** — `household_categories` junction table links custom categories to households. Auto-linked when sharing expenses.
9. **Reports category filter** — `by_category` in summary only shows categories the user can access (default + household-linked). Custom categories not associated with user's households are excluded.
10. **Tailwind v4** — `@import "tailwindcss"` not `@tailwind`
11. **Vite proxy** — `/api` → `localhost:8000`
12. **DateFilter** — Returns `{ start_date, end_date, month, year }`
13. **my_share field** — Proportional part for shared expenses
14. **is_debt/is_paid fields** — Track debts from and to others
15. **Debts in summary** — Total includes unpaid debts from others (with category visibility)
16. **Protected actions** — Cannot delete/unshare others' expenses
17. **Settings sidebar** — Sidebar navigation with Perfil + Categorías tabs
18. **Emoji suggestions** — Panel shows on input focus, closes on click outside
19. **Color scheme:**
     - Ingreso: 🟢 green
     - Gasto: 🔴 red
     - Shared by me: 🔴 red + "(€X compartido)"
     - Deuda (unpaid): 🟠 orange + "(debes)"
     - Pagado (others paid): 🔴 red + "(te deben)"

---

## Recent Commits

```
6550805 Feat: Associate custom categories to households via junction table for shared expense visibility
de44aa1 Feat: Include shared expense debts in reports by category and monthly breakdown
83936ba Feat: Redesign Reports page to match Dashboard style with dark theme and mobile responsiveness
e088a51 Feat: Redesign categories - global defaults + Settings sidebar + emoji panel
b45ce2b Feat: Incluir deudas en summary + proteger acciones de gastos de otros
92c5f5b Feat: Mostrar estado de pago en deudas - naranja (debes), púrpura (te deben), rojo (pagado)
200a2fd Feat: Mostrar deudas de gastos compartidos por otros en finanzas personales
fa90916 Feat: Gastos compartidos muestran parte proporcional + Fix selector año duplicado
```

---

## Quick Reference

**Key files by function:**

| Function | Backend | Frontend |
|----------|---------|----------|
| Auth | auth.py | AuthContext.jsx, Login.jsx, Register.jsx |
| Households | households.py | Household.jsx, HouseholdDetail.jsx, CreateHouseholdModal.jsx, InviteMemberModal.jsx |
| Personal | personal.py | PersonalFinances.jsx |
| Shared Expenses | expenses.py | ShareToHouseholdModal.jsx, HouseholdDetail.jsx |
| Categories | categories.py | Settings.jsx |
| Reports | expenses.py, personal.py | Reports.jsx |
| Dashboard | personal.py, households.py | Dashboard.jsx |
| Date Filter | — | DateFilter.jsx |

---