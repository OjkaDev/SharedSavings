from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import Base, engine
from app.routers import auth, households, expenses, personal, categories

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SharedSavings API",
    description="API for managing shared household expenses and personal finances",
    version="1.0.0",
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://sharedsavings.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(households.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(personal.router, prefix="/api")
app.include_router(categories.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "SharedSavings API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/test-register")
def test_register(data: dict):
    """Endpoint de prueba para debuggear el registro"""
    try:
        from app.routers.auth import register
        from app.schemas.schemas import UserCreate
        from app.models.database import SessionLocal
        
        db = SessionLocal()
        user_data = UserCreate(**data)
        result = register(user_data=user_data, db=db)
        db.close()
        return {"success": True, "data": result}
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
