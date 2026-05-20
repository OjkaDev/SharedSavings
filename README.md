<div align="center">

# 💰 SharedSavings

### Gestión inteligente de gastos compartidos y finanzas personales

*Aplicación web full-stack para grupos que comparten gastos (pisos, parejas, viajes) con seguimiento de deudas, finanzas personales y reportes visuales.*

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)

[Demo en vivo](https://shared-savings-sooty.vercel.app) · [Screenshots](#-screenshots) · [Funcionalidades](#-funcionalidades-clave) · [Stack](#-stack-tecnológico)

> ⚠️ **Nota:** el backend está desplegado en el plan gratuito de Render y puede tardar entre 30 y 60 segundos en arrancar si lleva 15 minutos inactivo. Si la app no carga al momento, espera un poco y recarga.

</div>

---

## 🎯 ¿Por qué esta aplicación?

Mi pareja y yo siempre dividimos todos los gastos mensuales de la casa. Las aplicaciones que más nos gustaban, ya sea por la flexibilidad de poder organizar diferentes grupos o por facilitarnos la visualización de los gastos, han pasado a ser de pago o a tener publicidad excesiva.
Por otro lado, me gusta llevar siempre un control de lo que gano y lo que gasto cada mes para poder seguir ahorrando. Cansado de probar aplicaciones que no me convencían, decidí hacer la mía propia.

**SharedSavings** unifica en una sola app:
- 🏠 **Gastos compartidos por grupo** con división automática (igual o por porcentaje).
- 💸 **Finanzas personales** (ingresos y gastos individuales) en el mismo dashboard.
- 🔄 **Cálculo automático de deudas** y estado de pagos por miembro.
- 📊 **Reportes con gráficas** para analizar dónde se va el dinero.

---

## ✨ Funcionalidades clave

### 👥 Grupos y miembros
- Crea grupos (pisos, parejas, viajes) e invita por email.
- Roles diferenciados: *owner* y *member*.

### 💳 Gastos compartidos
- División en partes iguales o por porcentaje personalizado.
- Estado de pago individual por miembro (pendiente / pagado).
- Compartir gastos personales al grupo en lote.

### 💰 Finanzas personales
- Ingresos y gastos individuales con categorías.
- Edición de gastos propios con restricciones para los compartidos.
- Visualización unificada: deudas que debes, gastos que compartiste, transacciones personales.

### 📂 Categorías
- Categorías globales por defecto (Alimentación, Transporte, Ocio…).
- Categorías personalizadas con emoji selector.
- Visibilidad inteligente vía junction table (`household_categories`).

### 📈 Reportes
- 4 gráficos Chart.js: distribución por categoría, evolución mensual, top gastos, ingresos vs gastos.
- Filtro por periodo: mes, trimestre, semestre o año.

### 🔐 Autenticación
- Registro / login vía **Supabase Auth**.
- Verificación de email y reset de contraseña.
- JWT verificado con **ES256 + JWKS**.

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 · Vite · Tailwind CSS v4 · React Router · Chart.js · Heroicons · Axios |
| **Backend** | FastAPI · SQLAlchemy · Pydantic v2 · Uvicorn |
| **Base de datos** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (ES256 JWT + JWKS) |
| **Infra** | Vercel (frontend) · Render (backend) |

---

## 🧠 Highlights técnicos

> Decisiones de diseño y problemas resueltos durante el desarrollo.

#### 🔑 Verificación JWT con ES256 + JWKS
Migración de HS256 (secreto compartido) a **ES256 con clave pública desde el JWKS de Supabase**. El backend FastAPI valida tokens criptográficamente sin necesidad de compartir secretos, con caché del JWKS para minimizar latencia.

#### 🔗 Junction table para visibilidad de categorías
Las categorías personalizadas son privadas por defecto, pero al compartir un gasto al grupo se enlazan automáticamente vía `household_categories`. Esto permite visibilidad granular sin duplicar registros y resuelve el problema de "categorías huérfanas" en gastos compartidos.

#### ♻️ Layer de helpers reutilizables (backend)
`utils/helpers.py` extrae lógica común: `get_household_or_403`, `create_expense_splits`, `apply_date_filters`, `get_shared_expense_info`. Los routers quedan enfocados solo en orquestación HTTP.

#### 🐛 Bug fix: bucle infinito de `useEffect`
Detectado y resuelto un bucle donde `DateFilter` se desmontaba durante `loading=true` y al remontarse disparaba `onChange` con un objeto nuevo, generando fetches infinitos. Solución: mantener el componente montado y reemplazar solo el bloque de datos con el spinner.

#### 🌍 Fechas TZ-safe
Helper `formatLocalDate()` reemplaza `toISOString().split('T')[0]` (que falla en TZ +1/+2 al desfasar el día). Bug que causaba que los gastos del último día del mes no aparecieran en el filtro de mes actual.

#### 🎨 Diseño responsive con Tailwind v4
Mobile-first con tema dark consistente, FAB dinámico que cambia de "+" a "compartir" según el estado, modales reutilizables, sidebar adaptativo en Settings.

---

## 🏗 Arquitectura

```
┌─────────────────┐      JWT (ES256)      ┌─────────────────┐
│  React + Vite   │ ────────────────────▶ │  FastAPI + SQLA │
│  Tailwind v4    │ ◀──── REST JSON ───── │  Pydantic v2    │
└────────┬────────┘                       └────────┬────────┘
         │                                         │
         │ Supabase Auth SDK                       │ asyncpg
         ▼                                         ▼
┌────────────────────────────────────────────────────────┐
│            Supabase (PostgreSQL + Auth)                │
│  · 7 tablas (users, households, expenses, splits…)     │
│  · JWKS endpoint para verificación criptográfica       │
└────────────────────────────────────────────────────────┘
```

**Modelo de datos** (7 tablas):
- `users` ↔ `household_members` ↔ `households` (M2M con rol)
- `expenses` (compartidos) → `expense_splits` (división por usuario, estado de pago)
- `personal_expenses` ←→ `expenses` (vínculo opcional al compartir)
- `categories` + `household_categories` (junction para visibilidad granular)

---

## 🚀 Inicio rápido

```bash
# Clonar
git clone https://github.com/OjkaDev/SharedSavings.git
cd SharedSavings

# Backend (puerto 8000)
cd backend
python -m venv venv && .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (puerto 5173) — en otra terminal
cd frontend
npm install
npm run dev
```

Variables de entorno necesarias:
- **Backend** (`backend/.env`): `SUPABASE_URL`, `DATABASE_URL`, `SECRET_KEY`
- **Frontend** (`frontend/.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

---

## 📁 Estructura del proyecto

```
SharedSavings/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI entry, CORS, seed categorías
│       ├── config.py            # Env vars + DEFAULT_CATEGORIES
│       ├── models/database.py   # 7 tablas SQLAlchemy
│       ├── schemas/schemas.py   # Pydantic request/response
│       ├── routers/             # auth, households, expenses, personal, categories
│       └── utils/               # JWT verify (ES256+JWKS), helpers reutilizables
│
├── frontend/
│   └── src/
│       ├── pages/               # Dashboard, PersonalFinances, Reports, Settings…
│       ├── components/          # DateFilter, modales, StatCard, LoadingSpinner
│       ├── context/AuthContext  # Supabase Auth provider
│       ├── services/api.js      # Axios + interceptor JWT
│       └── utils/dateUtils.js   # Helpers de período TZ-safe
│
└── README.md
```

---

## 🗺 Próximos pasos

**Ideas de nuevas funcionalidades:**
- [ ] Añadir calendario para compartir disponibilidad o días importantes.
- [ ] Listas de tareas.
- [ ] Listas de compra.

**Mejoras técnicas pendientes:**
- [ ] Internacionalización (ES / EN)
- [ ] Notificaciones push para deudas pendientes
- [ ] Modo oscuro / claro toggleable
- [ ] Export de reportes a PDF

---

## 📸 Screenshots

> *Próximamente — capturas del Dashboard, vista de grupo, finanzas personales y reportes.*

---

## 👤 Sobre el autor

**OjkaDev**

- 💼 [LinkedIn](https://linkedin.com/in/ojkadev)
- 📧 ojka96@gmail.com
- 🐙 [GitHub](https://github.com/OjkaDev)

---

<div align="center">

⭐ Si el proyecto te ha parecido interesante, considera darle una estrella

</div>
