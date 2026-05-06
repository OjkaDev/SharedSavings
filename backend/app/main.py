from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import Base, engine, Category
from app.config import DEFAULT_CATEGORIES
from app.routers import auth, households, expenses, personal, categories
from sqlalchemy.orm import Session

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed default global categories (only if they don't exist)
def seed_default_categories():
    with Session(engine) as db:
        # Create default global categories if they don't exist
        existing_defaults = db.query(Category).filter(
            Category.is_default == True,
            Category.household_id == None,
            Category.created_by == None
        ).first()
        
        if not existing_defaults:
            for cat_data in DEFAULT_CATEGORIES:
                category = Category(
                    name=cat_data["name"],
                    icon=cat_data["icon"],
                    is_default=True,
                    household_id=None,
                    created_by=None,
                )
                db.add(category)
            print("✓ Default global categories created")
        
        db.commit()

seed_default_categories()

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

origin_regex = r"https://sharedsavings.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
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
