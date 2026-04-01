import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-me")
DATABASE_URL = os.getenv("DATABASE_URL")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

DEFAULT_CATEGORIES = [
    {"name": "Comida", "icon": "🍔", "is_default": True},
    {"name": "Suministros", "icon": "💡", "is_default": True},
    {"name": "Alquiler", "icon": "🏠", "is_default": True},
    {"name": "Transporte", "icon": "🚗", "is_default": True},
    {"name": "Ocio", "icon": "🎬", "is_default": True},
    {"name": "Salud", "icon": "💊", "is_default": True},
    {"name": "Otros", "icon": "📦", "is_default": True},
]
