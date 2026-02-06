import bcrypt
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.models.user import User
from config.db import get_db
import uuid
from starlette.background import BackgroundTasks
from app.utils.email_utils import send_verification_email

# THIS IS REQUIRED — define the bearer scheme BEFORE the function
bearer_scheme = HTTPBearer()

# JWT Security Config
import os
SECRET_KEY = os.getenv("SECRET_KEY", "my_ultra_secure_and_long_secret_key_123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 10080  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(plain_password, hashed_password) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Generates a JWT Token with optional custom expiry delta."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    """Generates long-lived refresh token (7 days)."""
    return create_access_token(data, timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES))

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_new_user(db: Session, email: str, username: str, first_name: str, last_name: str, password: str, background_tasks: BackgroundTasks = None):
    hashed_pwd = hash_password(password)
    verification_token = None  # Disabled for development
    new_user = User(
        email=email,
        username=username,
        first_name=first_name,
        last_name=last_name,
        hashed_password=hashed_pwd,
        is_verified=True,
        verification_token=verification_token
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if False:  # Disabled email sending for development
        send_verification_email(email, verification_token, background_tasks)

    return new_user

def signup_user(db: Session, email: str, username: str, first_name: str, last_name: str, password: str, background_tasks: BackgroundTasks = None):
    """Controller for user signup - returns user or raises exception if email or username exists"""
    # Check if email already exists
    user_by_email = get_user_by_email(db, email)
    if user_by_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username already exists
    user_by_username = get_user_by_username(db, username)
    if user_by_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    return create_new_user(db, email, username, first_name, last_name, password, background_tasks)

def authenticate_user(db: Session, email: str, password: str):
    """Controller for user login - returns user or None if auth fails"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox."
        )

    return user

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Retrieves the current logged-in user based on the JWT token.

    Steps:
    1. Extract the token from Authorization header using HTTPBearer.
    2. Decode the JWT using the SECRET_KEY and ALGORITHM.
    3. Extract the email (sub) from the token payload.
    4. Retrieve the user from the database using the email.
    5. Raise 401 if token is invalid, expired, or user not found.
    """

    # Extract the token string from the Authorization header
    token = credentials.credentials

    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")  # The 'sub' field should contain user's email
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Retrieve the user from the database
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user

def change_password_service(db: Session, user: User, old_password: str, new_password: str):
    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password changed successfully"}

def forgot_password_service(db: Session, email: str):
    # This service function handles the core logic for the forgot password feature.
    # It first checks if the user exists in the database.

    # Query the database for the user with the provided email.
    user = db.query(User).filter(User.email == email).first()

    # If the user does not exist, we return None (or handle it based on requirements).
    if not user:
        return None

    # If the user exists, we would typically generate a password reset token here.
    # For now, we will generate a temporary token similar to login access token,
    # or just return a success message indicating the process has started.

    # Let's generate a reset token using the same method as access tokens for simplicity,
    # or just a dummy string if we want to be minimal.
    # But let's reuse create_access_token to give a real token back.

    reset_token = create_access_token(data={"sub": user.email, "type": "reset"})

    # In a real application, we would send this token via email.
    # For this API endpoint, we will return the token in the response so it can be verified.

    return {
        "message": "Password reset token generated",
        "reset_token": reset_token
    }

def logout_service(db: Session):
    # This service function handles the logout process.
    # In a stateless JWT architecture, the server typically doesn't need to do anything
    # as the token is stored on the client side.

    # However, if we had a blacklist mechanism (e.g., Redis), we would add the token to the blacklist here.
    # For now, we simply return a distinct success message.

    return {"message": "Logged out successfully"}

def reset_password_service(db: Session, reset_token: str, new_password: str):
    """
    Service for resetting password using reset_token from /forgot-password.
    - Decodes token to get email and validate type='reset'
    - Finds user by email
    - Updates hashed_password
    - Commits change
    - Returns success message
    """
    try:
        payload = jwt.decode(reset_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid reset token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password reset successfully"}
