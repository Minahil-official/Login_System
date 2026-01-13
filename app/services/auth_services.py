import bcrypt
from datetime import datetime, timedelta
from jose import jwt
from sqlalchemy.orm import Session
from app.models.user import User

# JWT Security Config
SECRET_KEY = "my_ultra_secure_and_long_secret_key_123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(plain_password, hashed_password) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_access_token(data: dict):
    """Generates a JWT Token for a logged-in user."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_new_user(db: Session, email: str, username: str, first_name: str, last_name: str, password: str):
    hashed_pwd = hash_password(password)
    new_user = User(email=email, username=username, first_name=first_name, last_name=last_name, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def signup_user(db: Session, email: str, username: str, first_name: str, last_name: str, password: str):
    """Controller for user signup - returns user or None if email exists"""
    user = get_user_by_email(db, email)
    if user:
        return None
    return create_new_user(db, email, username, first_name, last_name, password)

def authenticate_user(db: Session, email: str, password: str):
    """Controller for user login - returns user or None if auth fails"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
