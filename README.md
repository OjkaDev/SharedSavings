# SharedSavings 💰

Aplicación para compartir gastos entre personas de una misma vivienda.

## Estructura del Proyecto

```
Proyecto-Cuenta/
├── frontend/          # React + Tailwind CSS
│   ├── src/
│   ├── index.html
│   └── package.json
│
└── backend/           # FastAPI + PostgreSQL
    ├── app/
    ├── venv/
    └── requirements.txt
```

## Inicio Rápido

### Frontend
```bash
cd frontend
npm run dev
```

### Backend
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

## Tecnologías

- **Frontend:** React, Vite, Tailwind CSS, Chart.js, Axios
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL (Supabase)
- **Despliegue:** Vercel (frontend), Render (backend)
