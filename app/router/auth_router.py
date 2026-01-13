from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from config.db import get_db
from app.controllers import auth_controller

router = APIRouter(prefix="/auth", tags=["Authentication"])

class UserSignupSchema(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    password: str

class UserResponseSchema(BaseModel):
    id: int
    email: EmailStr
    username: str
    first_name: str
    last_name: str

    class Config:
        from_attributes = True

class LoginResponseSchema(BaseModel):
    access_token: str
    token_type: str
    user: UserResponseSchema

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup", response_model=UserResponseSchema)
def signup(user: UserSignupSchema, db: Session = Depends(get_db)):
    new_user = auth_controller.signup_controller(db, user)
    if not new_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return new_user

@router.post("/login", response_model=LoginResponseSchema)
def login(user: LoginSchema, db: Session = Depends(get_db)):
    login_data = auth_controller.login_controller(db, user)
    if not login_data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return login_data