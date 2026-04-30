from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import JWTError, jwt, jwk
from jose.utils import base64url_decode
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import requests
from app.config import SECRET_KEY, ALGORITHM, SUPABASE_URL
from app.models.database import get_db, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Cache for JWKS
_jwks_cache = None
_jwks_cache_time = None
JWKS_CACHE_DURATION = 3600  # 1 hour


def get_jwks():
    """Fetch JWKS from Supabase with caching."""
    global _jwks_cache, _jwks_cache_time

    now = datetime.utcnow().timestamp()

    if _jwks_cache and _jwks_cache_time and (now - _jwks_cache_time) < JWKS_CACHE_DURATION:
        return _jwks_cache

    try:
        response = requests.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=5)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = now
        return _jwks_cache
    except Exception as e:
        if _jwks_cache:
            return _jwks_cache
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch JWKS from Supabase"
        )


def verify_supabase_token(token: str) -> dict:
    """Verify a Supabase JWT token using ES256 and JWKS."""
    try:
        # Get token header
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg")

        if not kid:
            raise JWTError("Token missing 'kid' header")

        # Get JWKS
        jwks = get_jwks()

        # Find the matching key
        key_data = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                key_data = key
                break

        if not key_data:
            raise JWTError(f"Unable to find key with kid: {kid}")

        # Construct the public key from JWK
        public_key = jwk.construct(key_data, algorithm=alg)

        # Verify the signature
        message, encoded_sig = token.rsplit(".", 1)
        decoded_sig = base64url_decode(encoded_sig.encode("utf-8"))

        if not public_key.verify(message.encode("utf-8"), decoded_sig):
            raise JWTError("Signature verification failed")

        # Decode and return payload (without verification since we already verified)
        payload = jwt.get_unverified_claims(token)

        # Verify expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise JWTError("Token has expired")

        return payload

    except JWTError:
        raise
    except Exception as e:
        raise JWTError(f"Token verification failed: {str(e)}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Try to verify as Supabase JWT (ES256)
        payload = verify_supabase_token(token)
        supabase_uid_str = payload.get("sub")
        if supabase_uid_str is None:
            raise credentials_exception

        # Look up user by supabase_uid
        user = db.query(User).filter(User.supabase_uid == UUID(supabase_uid_str)).first()
        if user is None:
            raise credentials_exception
        return user

    except JWTError:
        # If Supabase JWT fails, try legacy JWT (for backward compatibility during migration)
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id_str = payload.get("sub")
            if user_id_str is None:
                raise credentials_exception
            user_id = int(user_id_str)

            user = db.query(User).filter(User.id == user_id).first()
            if user is None:
                raise credentials_exception
            return user
        except (JWTError, ValueError):
            raise credentials_exception
