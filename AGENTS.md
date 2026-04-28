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
| Auth | **Supabase Auth** (ES256 JWT, email verification, password reset) | — |

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
│   │   │   ├── households.py  # CRUD + invite + debts + pay-all + pay-member
│   │   │   ├── expenses.py    # CRUD + summary + share/unshare + monthly
│   │   │   ├── personal.py    # CRUD personal expenses + summary + monthly + debts
│   │   │   └── categories.py  # CRUD (default categories protected)
│   │   ├── services/        # EMPTY — business logic in routers
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── auth.py      # JWT verify (ES256 with JWKS) + get_current_user
│   ├── requirements.txt
│   └── .env               # SUPABASE_URL, SUPABASE_KEY, SUPABASE_JWT_SECRET, SECRET_KEY, DATABASE_URL
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
│   │   │   ├── Login.jsx           # Login form + "Forgot password" link
│   │   │   ├── Register.jsx       # Registration + email exist detection
│   │   │   ├── VerifyEmail.jsx    # Email verification handler
│   │   │   ├── ForgotPassword.jsx # Request password reset
│   │   │   ├── ResetPassword.jsx  # Set new password after reset
│   │   │   ├── Dashboard.jsx     # Stats with real data
│   │   │   ├── Household.jsx      # List/create/delete households
│   │   │   ├── HouseholdDetail.jsx # Stats Dashboard style + debts + shared expenses with status
│   │   │   ├── PersonalFinances.jsx # CRUD + share to household + FAB + period filter
│   │   │   ├── Settings.jsx        # Profile, password, categories
│   │   │   └── Reports.jsx        # 4 Chart.js graphs + period filter
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Supabase Auth: user, loading, login, register, logout, resetPassword, updatePassword
│   │   ├── lib/
│   │   │   └── supabase.js    # Supabase client instance
│   │   ├── services/
│   │   │   └── api.js         # Axios + Supabase token interceptor + 401 redirect
│   │   └── utils/
│   │       └── dateUtils.js   # Period helpers (month/quarter/semester/year) + getCurrentMonth, MONTHS, PERIODS
│   ├── package.json
│   ├── vite.config.js      # Proxy /api -> localhost:8000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env               # VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
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
| **User** | id, supabase_uid(UUID), email(unique), name, password_hash(nullable) | M2M households, 1:N personal_expenses, 1:N expenses_paid, 1:N expense_splits. `supabase_uid` links to Supabase Auth. `password_hash` is null for Supabase Auth users. |
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
| POST | `/api/auth/sync` | Yes | Sync Supabase user to local DB (creates or updates user) |
| GET | `/api/auth/me` | Yes | Current user profile |
| PUT | `/api/auth/profile` | Yes | Update name (query param) |
| PUT | `/api/auth/password` | Yes | Change password (legacy users only) |

**Note:** Register and Login are handled by Supabase Auth on the frontend. The `/sync` endpoint creates/updates the user in the local database after Supabase authentication.

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
| GET | `/api/personal/top-expenses` | Yes | Top 10 expenses by amount (personal + debts, filterable by date range) |
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
| `/login` | Login | No | ✅ + "Forgot password" link |
| `/register` | Register | No | ✅ + email exist detection |
| `/verify-email` | VerifyEmail | No | ✅ Email verification handler |
| `/forgot-password` | ForgotPassword | No | ✅ Request password reset |
| `/reset-password` | ResetPassword | No | ✅ Set new password |
| `/` | Dashboard | Yes | ✅ Real data |
| `/personal` | PersonalFinances | Yes | ✅ + debts display |
| `/household` | Household | Yes | ✅ |
| `/household/:id` | HouseholdDetail | Yes | ✅ + date filter |
| `/reports` | Reports | Yes | ✅ 5 charts |
| `/settings` | Settings | Yes | ✅ profile + categories |

---

## Key Data Flows

### Auth Flow (Supabase Auth)
1. **Register:** Frontend calls `supabase.auth.signUp()` → Supabase sends verification email → User clicks link → Redirected to `/verify-email`
2. **Login:** Frontend calls `supabase.auth.signInWithPassword()` → Supabase verifies → Returns JWT token
3. **Sync:** After login/verification, frontend calls `POST /api/auth/sync` → Backend creates/updates user in local DB
4. **Token:** `api.js` interceptor gets token from Supabase session → Adds `Authorization: Bearer <token>`
5. **Verify:** Backend verifies JWT using ES256 + JWKS from Supabase → Extracts `sub` (UUID) → Finds user by `supabase_uid`
6. **Password Reset:** Frontend calls `supabase.auth.resetPasswordForEmail()` → Supabase sends reset email → User clicks link → Redirected to `/reset-password` → Sets new password

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
| SyncUserRequest | supabase_uid, email, name? |
| UserResponse | id, email, name, created_at |
| PasswordChange | current_password, new_password |
| HouseholdCreate | name |
| HouseholdResponse | id, name, created_by, members[] |
| CategoryCreate | name, icon? |
| CategoryResponse | id, name, icon, is_default, household_id |
| ExpenseCreate | household_id, amount, description?, category_id?, date, split_type, splits[] |
| ExpenseResponse | id, household_id, paid_by, amount, ..., splits[] |
| PersonalExpenseCreate | amount, description?, category_id?, date, type("expense") |
| PersonalExpenseResponse | id, user_id, amount, ..., shared_expense_id?, my_share?, is_shared_by_me?, is_debt?, is_paid?, is_fully_paid? |
| PersonalSummary | income, expenses, balance, by_category |
| TopExpense | description, amount, category_name, date, type("personal"/"debt") |
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
- **Supabase Auth migration:** Email verification, password reset, email exist detection
- **JWT verification:** ES256 with JWKS (replaces HS256)
- **New pages:** VerifyEmail, ForgotPassword, ResetPassword
- **Auth flow:** Supabase Auth → sync to local DB → JWT verification
- Household CRUD + invite members
- Personal finances CRUD (income/expense)
- Share expenses to household with split config
- Household detail with debt summary
- Settings page with sidebar navigation (Perfil, Categorías)
- Profile + Password unified in one section
- Date filters on PersonalFinances, HouseholdDetail, Reports
- Reports page with 4 Chart.js graphs + period filter (month/quarter/semester/year)
- Dashboard with real data from current month
- DateFilter redesigned with segmented control (period selector) + SVG chevron arrows
- Period-aware stats: income/expenses/savings/shared respond to selected period
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
- Top Gastos chart (horizontal bars) replaces Evolución mensual + Ahorro mensual
- GET /personal/top-expenses endpoint (combines personal expenses + debts, sorted by amount)
- PersonalFinances redesigned with dark theme (Dashboard style), FAB button (dynamic: +/share)
- getPeriodLabel() shared utility in dateUtils.js (used by Reports, PersonalFinances, HouseholdDetail)
- HouseholdDetail redesigned with Dashboard-style stats, status column, individual pay buttons
- PUT /households/{id}/pay-member endpoint for paying debts to specific member
- is_fully_paid flag on shared expenses (all non-payer splits paid)
- Paid debts still counted in monthly summary (no paid==False filter)
- Date filter on debt_total in summary endpoint
- Fixed: table-header alignment (added px-4)
- fab and fab-secondary CSS utilities for floating action buttons

**Pending:**
- Database review and security
- Deployment to Vercel + Render

---

## Gotchas & Design Notes

1. **No services layer** — Business logic in router files
2. **No migrations** — Tables auto-created on startup (not production-ready)
3. **No pagination** — All endpoints return everything
4. **No expense updates** — Create/delete only
5. **Profile update uses query param** — `PUT /api/auth/profile?name=foo`
6. **Default categories** — 7 Spanish categories, global (created once at startup), visible to all users
7. **Custom category visibility** — `household_categories` junction table links custom categories to households. Auto-linked when sharing expenses.
8. **Reports category filter** — `by_category` in summary only shows categories the user can access (default + household-linked). Custom categories not associated with user's households are excluded.
9. **Tailwind v4** — `@import "tailwindcss"` not `@tailwind`
10. **Vite proxy** — `/api` → `localhost:8000`
11. **DateFilter** — Returns `{ start_date, end_date, month, year }`
12. **my_share field** — Proportional part for shared expenses
13. **is_debt/is_paid fields** — Track debts from and to others
14. **Debts in summary** — Total includes unpaid debts from others (with category visibility)
15. **Protected actions** — Cannot delete/unshare others' expenses. Cannot unshare/delete fully paid shared expenses.
16. **Settings sidebar** — Sidebar navigation with Perfil + Categorías tabs
17. **Emoji suggestions** — Panel shows on input focus, closes on click outside
18. **is_fully_paid** — Computed in GET /personal/expenses: checks if all non-payer splits are paid
19. **FAB button** — Dynamic: + (green) when no selection, house icon (gray) when items selected for sharing
20. **Debts in reports** — Include paid and unpaid debts (removed paid==False filter from summary/monthly)
21. **Supabase Auth** — Register/login handled by Supabase, not backend. Backend verifies JWT with ES256 + JWKS.
22. **Email verification** — Supabase sends verification email automatically. Redirect URL must be configured in Supabase Dashboard.
23. **Password reset** — Handled by Supabase. User clicks link in email → redirected to `/reset-password`.
24. **Email exist detection** — Supabase doesn't return error for existing emails (security). Check `user.identities.length === 0` to detect.
25. **Color scheme:**
     - Ingreso: 🟢 green
     - Gasto: 🔴 red
     - Shared by me: 🔴 red + "(€X compartido)"
     - Deuda (unpaid): 🟠 orange + "(debes)"
     - Pagado (debt paid): no subtitle (was "(te deber)" — removed)
     - Pagado (shared settled): 🟢 green badge "Pagado"

---

## Recent Commits

```
a9d3a0b Feat: Top gastos chart + period filter (month/quarter/semester/year) + redesigned DateFilter
8b1eda9 Docs: Update AGENTS.md with Reports redesign, household_categories, and category visibility rules
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
| Auth | auth.py, utils/auth.py | AuthContext.jsx, Login.jsx, Register.jsx, lib/supabase.js |
| Email Verification | — | VerifyEmail.jsx |
| Password Reset | — | ForgotPassword.jsx, ResetPassword.jsx |
| Households | households.py | Household.jsx, HouseholdDetail.jsx, CreateHouseholdModal.jsx, InviteMemberModal.jsx |
| Personal | personal.py | PersonalFinances.jsx |
| Shared Expenses | expenses.py | ShareToHouseholdModal.jsx, HouseholdDetail.jsx |
| Categories | categories.py | Settings.jsx |
| Reports | expenses.py, personal.py | Reports.jsx |
| Dashboard | personal.py, households.py | Dashboard.jsx |
| Date Filter | — | DateFilter.jsx |

---