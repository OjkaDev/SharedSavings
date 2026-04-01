# SharedSavings - Plan de Desarrollo

## Descripción del Proyecto

SharedSavings es una aplicación web para compartir gastos entre personas de una misma vivienda y llevar un control de finanzas personales.

## Stack Tecnológico

| Capa | Tecnología | Despliegue |
|------|------------|------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 | Vercel |
| Backend | FastAPI + SQLAlchemy | Render |
| Base de Datos | PostgreSQL (Supabase) | Supabase |
| Autenticación | JWT (python-jose) | - |
| Gráficos | Chart.js + react-chartjs-2 | - |

## Funcionalidades Principales

1. **Autenticación**: Registro/Login con JWT
2. **Gestión de Viviendas**: Crear/eliminar viviendas, invitar miembros
3. **Gastos Compartidos**: Registrar gastos con división (igual/porcentaje)
4. **Finanzas Personales**: Ingresos y gastos personales
5. **Categorías**: Predefinidas + personalizables
6. **Reportes**: Gráficos con Chart.js
7. **Dashboard**: Resumen general

## Estructura del Proyecto

```
Proyecto-Cuenta/
├── frontend/
│   ├── src/
│   │   ├── components/     Layout.jsx
│   │   ├── pages/          Dashboard, Login, Register
│   │   ├── context/        AuthContext.jsx
│   │   └── services/       api.js
│   └── package.json
│
└── backend/
    ├── app/
    │   ├── main.py
    │   ├── config.py
    │   ├── models/         database.py
    │   ├── schemas/        schemas.py
    │   ├── routers/        auth, households, expenses, personal, categories
    │   └── utils/          auth.py
    └── requirements.txt
```

## Base de Datos (Tablas)

- `users`: Usuarios del sistema
- `households`: Viviendas/grupos
- `household_members`: Relación usuarios-viviendas
- `expenses`: Gastos compartidos
- `expense_splits`: División de cada gasto
- `categories`: Categorías de gastos
- `personal_expenses`: Gastos/ingresos personales

## Plan de Desarrollo (12 Fases)

### Fase 1: Configuración Frontend ✅
- [x] Verificar Tailwind
- [x] Crear estructura de carpetas
- [x] Configurar React Router
- [x] Crear componente Layout
- [x] Crear páginas placeholder
- [x] Crear AuthContext básico

### Fase 2: Autenticación Frontend ✅
- [x] Crear AuthContext completo
- [x] Crear página Login con API
- [x] Crear página Register con API
- [x] Crear ProtectedRoute
- [x] Actualizar Layout con info usuario y logout

### Fase 3: Configuración Backend
- [ ] Configurar Supabase
- [ ] Configurar .env
- [ ] Verificar conexión
- [ ] Crear tablas

### Fase 4: API de Autenticación
- [ ] Probar endpoints auth
- [ ] Verificar JWT
- [ ] Probar /api/auth/me

### Fase 5: Gestión de Viviendas
- [ ] Crear página Household
- [ ] Modal crear vivienda
- [ ] Modal invitar miembro
- [ ] Eliminar vivienda

### Fase 6: Gastos Compartidos
- [ ] Crear página SharedExpenses
- [ ] Modal nuevo gasto
- [ ] Tabla de gastos
- [ ] Eliminar gasto

### Fase 7: Finanzas Personales
- [ ] Crear página PersonalFinances
- [ ] Cards de resumen
- [ ] Historial de transacciones
- [ ] Modal nueva transacción

### Fase 8: Categorías
- [ ] Crear página Settings
- [ ] Gestión de categorías
- [ ] Categorías por defecto

### Fase 9: Gráficos y Reportes
- [ ] Crear página Reports
- [ ] Gráfico de categorías
- [ ] Gráfico mensual
- [ ] Filtros por período

### Fase 10: Dashboard
- [ ] Crear página Dashboard
- [ ] Cards de estadísticas
- [ ] Actividad reciente
- [ ] Accesos rápidos

### Fase 11: Perfil y Configuración
- [ ] Sección perfil en Settings
- [ ] Cambiar contraseña

### Fase 12: Despliegue
- [ ] Preparar frontend para Vercel
- [ ] Preparar backend para Render
- [ ] Configurar CORS
- [ ] Deploy

## Estado Actual

**Completado (Fase 1-2):**
- Estructura del proyecto creada
- Frontend funcional con Tailwind CSS v4
- React Router configurado
- Layout con navegación
- Páginas placeholder (Dashboard, Login, Register)
- AuthContext completo con verificación de token
- Login conectado con API
- Register conectado con API
- ProtectedRoute creado
- Layout con info usuario y logout

**Siguiente paso:** Fase 3 - Configuración Backend (Supabase)

## Instrucciones para Ejecutar

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

## Notas Importantes

1. Tailwind CSS v4 usa `@import "tailwindcss"` en lugar de `@tailwind base/components/utilities`
2. Tailwind v4 requiere `@tailwindcss/postcss` como plugin de PostCSS
3. El backend requiere configurar credenciales de Supabase en `.env`
4. Las tablas se crean automáticamente al iniciar el backend
