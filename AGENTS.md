# AGENTS.md — SharedSavings Project Guide

> Quick-reference for any agent working on this codebase. Read this first to save tokens.

---

## Project at a Glance

**What:** Shared household expense manager. Users create households, add members, log personal income/expenses, and share expenses with configurable splits (equal/percentage).

**Stack:**
| Layer | Tech | Deploy |
|-------|------|--------|
| Frontend | React 19 + Vite + Tailwind CSS v4 + Chart.js + Axios | Vercel |
| Backend | FastAPI + SQLAlchemy 2.0 + PostgreSQL (Supabase) | Render |
| Auth | JWT (HS256, 30-day expiry, python-jose + passlib/bcrypt) | — |

**Run:**
```bash
# Frontend (port 5173)
cd frontend && npm run dev

# Backend (port 8000)
cd backend && .\venv\Scripts\activate && uvicorn app.main:app --reload
```

---

## Directory Map

```
Proyecto-Cuenta/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, mounts routers, creates tables
│   │   ├── config.py            # Env vars + DEFAULT_CATEGORIES (7 Spanish categories)
│   │   ├── models/
│   │   │   └── database.py      # 7 SQLAlchemy models + SessionLocal + get_db()
│   │   ├── schemas/
│   │   │   └── schemas.py       # All Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py          # POST /register, /login; GET /me; PUT /profile, /password
│   │   │   ├── households.py    # CRUD + invite + debts (date filter) + pay-all
│   │   │   ├── expenses.py      # CRUD + summary (date filter) + share/unshare + monthly
│   │   │   ├── personal.py      # CRUD personal expenses + summary (date filter) + monthly
│   │   │   └── categories.py    # CRUD (default categories protected)
│   │   ├── services/            # EMPTY — business logic lives in routers
│   │   └── utils/
│   │       └── auth.py          # JWT create/verify + get_current_user dependency
│   ├── requirements.txt
│   └── .env                     # SUPABASE_URL, SUPABASE_KEY, SECRET_KEY, DATABASE_URL
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # Entry: BrowserRouter + AuthProvider + <App/>
│   │   ├── App.jsx              # Routes (see Routing section)
│   │   ├── index.css            # Tailwind v4 + custom @utility classes (btn-primary, btn-secondary, input-field, card)
│   │   ├── components/
│   │   │   ├── Layout.jsx              # Shell: navbar + <Outlet/>
│   │   │   ├── ProtectedRoute.jsx      # Redirects to /login if no user
│   │   │   ├── CreateHouseholdModal.jsx
│   │   │   ├── HouseholdCard.jsx
│   │   │   ├── InviteMemberModal.jsx
│   │   │   ├── ShareToHouseholdModal.jsx  # 2-step: pick household, configure splits
│   │   │   └── DateFilter.jsx          # Shared month/year filter component
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx           # Real data from current month
│   │   │   ├── Household.jsx           # List/create/delete households, invite members
│   │   │   ├── HouseholdDetail.jsx     # Debts summary + shared expenses table + date filter
│   │   │   ├── PersonalFinances.jsx    # CRUD transactions + share to household + date filter
│   │   │   ├── Settings.jsx            # Profile, password, category management + emoji picker
│   │   │   └── Reports.jsx             # 5 charts: income vs expenses, categories, trend, savings, shared
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # {user, loading, login, register, logout}
│   │   ├── services/
│   │   │   └── api.js           # Axios instance + auth interceptor + 401 redirect
│   │   ├── utils/
│   │   │   └── dateUtils.js     # getMonthRange, getCurrentMonth, getAvailableYears, MONTHS
│   │   ├── hooks/               # EMPTY
│   ├── package.json
│   ├── vite.config.js           # Proxy /api -> localhost:8000
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── PLAN.md                      # 12-phase dev plan (Fases 1-9 done, 10-11 pending)
├── Pront.txt                    # Full project document (redundant with this file)
└── README.md
```

---

## Database Models (7 tables)

```
users (1) <--M--> household_members (M) <--M--> (1) households
  |                                                       |
  |--> (M) personal_expenses                               |--> (M) expenses
  |--> (M) expense_splits                                  |      |
  |--> (M) expenses (as paid_by)                           |      |--> (M) expense_splits
                                                            |
                                                            |--> (M) categories
```

| Model | Key Columns | Notes |
|-------|-------------|-------|
| **User** | id, email(unique), name, password_hash | M2M households, 1:N personal_expenses, 1:N expenses |
| **Household** | id, name, created_by(FK->users) | 1:N expenses (cascade delete), M2M members |
| **household_members** | user_id, household_id, role("owner"/"member"), joined_at | Association table with extra columns |
| **Category** | id, name, icon, is_default, household_id, created_by | is_default=True = global; else household-specific |
| **Expense** | id, household_id, paid_by, amount, description, category_id, date, split_type("equal"/"percentage"), personal_expense_id | Links back to PersonalExpense when shared |
| **ExpenseSplit** | id, expense_id, user_id, amount, percentage, paid | Who owes what for each expense |
| **PersonalExpense** | id, user_id, amount, description, category_id, date, type("expense"/"income") | 1:1 Expense via personal_expense_id FK |

**Auto-create:** `Base.metadata.create_all()` runs on every startup (main.py:7). No migrations.

---

## API Endpoints (28 total)

### Public (2)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info |
| GET | `/health` | `{"status": "healthy"}` |

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create user + return JWT |
| POST | `/api/auth/login` | No | Login + return JWT |
| GET | `/api/auth/me` | Yes | Current user profile |
| PUT | `/api/auth/profile` | Yes | Update name (query param, NOT body) |
| PUT | `/api/auth/password` | Yes | Change password |

### Households (`/api/households`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/households/` | Yes | List user's households |
| POST | `/api/households/` | Yes | Create household + 7 default categories |
| GET | `/api/households/{id}` | Yes | Get household + members |
| DELETE | `/api/households/{id}` | Yes | Delete (creator only) |
| POST | `/api/households/{id}/invite` | Yes | Invite user by email |
| GET | `/api/households/{id}/debts` | Yes | Debt summary (filter: start_date, end_date) |
| PUT | `/api/households/{id}/pay-all` | Yes | Mark all user's unpaid splits as paid |

### Expenses (`/api/expenses`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/expenses/` | Yes | List (filter: household_id, category_id, start_date, end_date) |
| GET | `/api/expenses/summary` | Yes | Total + pending + by_category (filter: start_date, end_date) |
| GET | `/api/expenses/monthly` | Yes | Monthly breakdown of shared expenses by year |
| POST | `/api/expenses/` | Yes | Create shared expense with auto-splits |
| DELETE | `/api/expenses/{id}` | Yes | Delete (payer only) |
| POST | `/api/expenses/share` | Yes | Bulk share personal expenses to household |
| DELETE | `/api/expenses/{id}/unshare` | Yes | Remove shared expense, keep personal |

### Personal (`/api/personal`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/personal/expenses` | Yes | List (filter: type, category_id, start_date, end_date) |
| GET | `/api/personal/summary` | Yes | Income/expenses/balance + by_category (filter: start_date, end_date) |
| GET | `/api/personal/monthly` | Yes | Monthly income/expenses/balance by year |
| POST | `/api/personal/expenses` | Yes | Create income or expense |
| DELETE | `/api/personal/expenses/{id}` | Yes | Delete (blocked if already shared) |

### Categories (`/api/categories`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/categories/` | Yes | List (filter: household_id) |
| POST | `/api/categories/` | Yes | Create custom (always is_default=False) |
| PUT | `/api/categories/{id}` | Yes | Update (owner only, blocks defaults) |
| DELETE | `/api/categories/{id}` | Yes | Delete (owner only, blocks defaults) |

---

## Frontend Routing

| Path | Component | Protected | Status |
|------|-----------|-----------|--------|
| `/login` | Login | No | Implemented |
| `/register` | Register | No | Implemented |
| `/` | Dashboard | Yes | Implemented — real data from current month |
| `/personal` | PersonalFinances | Yes | Implemented — shows my_share for shared expenses |
| `/household` | Household | Yes | Implemented |
| `/household/:id` | HouseholdDetail | Yes | Implemented (date filter) |
| `/reports` | Reports | Yes | Implemented — 5 charts with Chart.js |
| `/settings` | Settings | Yes | Implemented — profile, password, category management |

**Important:** `/shared-expenses` link was removed from nav. Dashboard now shows real data (no longer static).

---

## Key Data Flows

### Auth Flow
1. Login/Register -> POST to backend -> stores JWT in localStorage
2. `api.js` interceptor auto-attaches `Authorization: Bearer <token>`
3. `AuthContext.checkAuth()` validates token via `/auth/me` on mount
4. 401 response -> clears token -> redirects to `/login`

### Share Personal Expense to Household
1. User selects transactions in PersonalFinances (checkboxes)
2. Opens ShareToHouseholdModal -> Step 1: pick household -> Step 2: configure split type per expense
3. POST `/api/expenses/share` -> backend creates Expense + ExpenseSplit records, links via personal_expense_id
4. Shared transactions show home icon, delete disabled until unshared

### Debt Calculation
- Debts computed dynamically from ExpenseSplit.paid status (not stored as balance)
- `GET /households/{id}/debts` returns you_owe, you_are_owed, balance, per-member breakdown

---

## Pydantic Schemas Quick Ref

| Schema | Key Fields | Used For |
|--------|------------|----------|
| UserCreate | email, password, name? | Register |
| UserLogin | email, password | Login |
| UserResponse | id, email, name, created_at | User responses |
| Token | access_token, token_type | Auth response |
| HouseholdCreate | name | Create household |
| HouseholdResponse | id, name, created_by, members[] | Household responses |
| CategoryCreate | name, icon? | Create category |
| CategoryResponse | id, name, icon, is_default, household_id | Category responses |
| ExpenseCreate | household_id, amount, description?, category_id?, date, split_type, splits[] | Create expense |
| ExpenseResponse | id, household_id, paid_by, amount, ..., splits[] | Expense responses |
| PersonalExpenseCreate | amount, description?, category_id?, date, type("expense") | Create personal |
| PersonalExpenseResponse | id, user_id, amount, ..., shared_expense_id?, my_share? | Personal responses |
| ShareExpensesRequest | household_id, expenses[{expense_id, split_type, splits[]}] | Share to household |
| ShareExpensesResponse | shared, total, message | Share response |
| PersonalSummary | income, expenses, balance, by_category | Personal summary |
| MonthlyPersonalData | month, income, expenses, balance | GET /personal/monthly |
| MonthlySharedData | month, total, my_share | GET /expenses/monthly |
| DebtDetail | user_id, user_name, user_email, amount_owed, splits[] | Per-member debt |
| DebtSummary | you_owe, you_are_owed, balance, debts[] | Debt overview |

---

## Development Status

**Completed (Fases 1-11 partial):**
- Full auth system (frontend + backend)
- Household CRUD + invite members
- Personal finances CRUD
- Share personal expenses to household with split configuration
- Household detail with debt summary and shared expenses
- Settings page with profile, password, and category management
- Emoji picker with category filters for creating categories
- Date filters on PersonalFinances, HouseholdDetail, and Reports
- Shared DateFilter component with month/year selector
- Reports page with 5 Chart.js graphs (income vs expenses, categories, trend, savings, shared)
- Backend monthly endpoints for personal and shared expenses
- Date range filters on expenses, debts, and personal summary endpoints
- Dashboard with real data (current month)
- Reports: unified year selector (DateFilter)
- PersonalFinances: shows my_share for shared expenses in table
- Personal summary: calculates proportional share for shared expenses

---

## Gotchas & Design Notes

1. **No services layer** — All business logic lives in router files. `services/` dir is empty.
2. **No migrations** — Tables auto-created on startup. Not production-ready.
3. **No refresh tokens** — 30-day JWT expiry, then re-login required.
4. **No pagination** — All list endpoints return everything.
5. **No expense updates** — Expenses can be created/deleted but not edited.
6. **Profile update uses query param** — `PUT /api/auth/profile?name=foo` (unconventional).
7. **Default categories per household** — 7 Spanish categories created on household creation.
8. **Tailwind v4** — Uses `@import "tailwindcss"` not `@tailwind` directives. Custom utilities via `@utility`.
9. **Vite proxy** — `/api` requests proxied to `localhost:8000` in dev.
10. **Date filters affect debt calculation** — In HouseholdDetail, debts are filtered by the selected month/year, not global.
11. **Shared DateFilter component** — Used in PersonalFinances, HouseholdDetail, and Reports. Returns `{ start_date, end_date }` via onChange.
12. **utils/ not empty** — Contains `dateUtils.js` with `getMonthRange`, `getCurrentMonth`, `getAvailableYears`, `MONTHS`.
13. **my_share field** — Shared expenses return `my_share` (proportional part) in PersonalExpenseResponse.
14. **Personal summary calculates proportional** — `/personal/summary` now shows only the user's proportional share for shared expenses.
