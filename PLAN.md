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

### Fase 3: Configuración Backend ✅
- [x] Configurar Supabase (cuenta creada con GitHub)
- [x] Configurar .env con credenciales
- [x] Verificar conexión (usando connection pooling)
- [x] Crear tablas (7 tablas creadas automáticamente)

### Fase 4: API de Autenticación ✅
- [x] Probar endpoints auth (register, login)
- [x] Verificar JWT (corregido: sub field debe ser string)
- [x] Probar /api/auth/me
- [x] Instalar bcrypt 4.0.1 (compatibilidad con passlib)

### Fase 5: Gestión de Viviendas ✅
- [x] Crear página Household
- [x] Modal crear vivienda (CreateHouseholdModal)
- [x] Modal invitar miembro (InviteMemberModal)
- [x] Componente HouseholdCard
- [x] Eliminar vivienda (solo propietario)
- [x] Ruta añadida en App.jsx

### Fase 6: Sistema de Gastos Unificado ✅
- [x] Backend: Endpoint POST /api/expenses/share
- [x] Backend: Endpoint GET /api/households/:id/debts
- [x] Backend: Endpoint PUT /api/households/:id/pay-all
- [x] Frontend: Modal ShareToHouseholdModal.jsx
- [x] Frontend: Página PersonalFinances.jsx con checkboxes
- [x] Frontend: Página HouseholdDetail.jsx con deudas
- [x] Frontend: Rutas actualizadas en App.jsx

### Fase 7: Categorías y Configuración ✅
- [x] Crear página Settings
- [x] Gestión de categorías con selector de vivienda
- [x] Categorías por defecto protegidas
- [x] Selector de emojis con filtros por categoría (Alimentación, Hogar, Transporte, Ocio, Servicios, Otros)
- [x] Sección perfil (cambiar nombre)
- [x] Sección cambiar contraseña

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

**Completado (Fase 1-7):**
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
- Supabase configurado y conectado
- 7 tablas creadas en PostgreSQL
- Backend funcional con FastAPI
- API de autenticación probada y funcional (register, login, /me)
- JWT corregido (sub field como string)
- bcrypt 4.0.1 instalado (compatibilidad con passlib)
- Página Household completa
- Modales para crear vivienda e invitar miembros
- Componente HouseholdCard
- Funcionalidad de eliminar vivienda
- Página PersonalFinances con checkboxes y compartir gastos
- Modal ShareToHouseholdModal para compartir a viviendas
- Página HouseholdDetail con resumen de deudas
- Endpoint para marcar todas las deudas como pagadas
- Sistema de gastos unificado implementado
- Página Settings con gestión de categorías, perfil y contraseña
- Selector de emojis con filtros por categoría
- Sección de perfil: cambiar nombre
- Sección de contraseña: cambiar contraseña con validación

**Siguiente paso:** Fase 9 - Gráficos y Reportes

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
