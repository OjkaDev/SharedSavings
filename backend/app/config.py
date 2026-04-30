import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-me")
DATABASE_URL = os.getenv("DATABASE_URL")
ALGORITHM = "HS256"

DEFAULT_CATEGORIES = [
    {"name": "Comida", "icon": "🍔", "is_default": True},
    {"name": "Suministros", "icon": "💡", "is_default": True},
    {"name": "Alquiler", "icon": "🏠", "is_default": True},
    {"name": "Transporte", "icon": "🚗", "is_default": True},
    {"name": "Ocio", "icon": "🎬", "is_default": True},
    {"name": "Salud", "icon": "💊", "is_default": True},
    {"name": "Otros", "icon": "📦", "is_default": True},
]
