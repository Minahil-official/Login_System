from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from config.db import get_db
from app.controllers import auth_controller
from app.services import auth_services
from app.models.user import User

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
    refresh_token: str

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ChangePasswordSchema(BaseModel):
    old_password: str
    new_password: str

class ResetPasswordSchema(BaseModel):
    """Schema for password reset using reset token from /auth/forgot-password endpoint (public)."""
    reset_token: str
    new_password: str

class RefreshSchema(BaseModel):
    """Schema for refresh token request (public endpoint)."""
    refresh_token: str

@router.post("/signup", response_model=UserResponseSchema)
def signup(user: UserSignupSchema, db: Session = Depends(get_db), background_tasks: BackgroundTasks = BackgroundTasks()):
    new_user = auth_controller.signup_controller(db, user, background_tasks)
    if not new_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return new_user

@router.post("/login", response_model=LoginResponseSchema)
def login(user: LoginSchema, db: Session = Depends(get_db)):
    login_data = auth_controller.login_controller(db, user.email, user.password)
    if not login_data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return login_data

@router.post("/token", response_model=LoginResponseSchema)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Endpoint for Swagger UI (OAuth2 compliance).
    Receives form-data: username, password.
    Returns: access_token.
    NOTE: 'username' field MUST contain the email address.
    """
    login_data = auth_controller.login_controller(db, form_data.username, form_data.password)
    if not login_data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return login_data

@router.post("/forgot-password")
def forgot_password(user: ForgotPasswordSchema, db: Session = Depends(get_db)):
    # This endpoint handles the forgot password request.
    # It receives the email from the user and passes it to the controller logic.
    result = auth_controller.forgot_password_controller(db, user)
    if not result:
        # If the email is not found, we generally don't want to expose that information for security reasons.
        # But for this exercise, we might return 404 if the user doesn't exist, or just success.
        # Let's follow the pattern: if the controller returns something falsey, we might assume user not found.
        # However, standard practice is to always say "If email exists, instruction sent."
        # For this specific task, if "result" implies failure (like user not found), handle it.
        raise HTTPException(status_code=404, detail="User not found")

    return result

@router.post("/logout")
def logout(db: Session = Depends(get_db)):
    # This endpoint handles the user logout.
    # Since we are using stateless JWT authentication, the server does not store the session.
    # The client is responsible for deleting the token.
    # However, we provide this endpoint to allow for potential future server-side cleanup (e.g. logging, blacklisting).

    result = auth_controller.logout_controller(db)
    return result

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordSchema,
    current_user: User = Depends(auth_services.get_current_user),
    db: Session = Depends(get_db)
):
    return auth_controller.change_password_controller(db, current_user, password_data)

@router.get("/me", response_model=UserResponseSchema)
def me(current_user: User = Depends(auth_services.get_current_user)):
    """
    Get current user profile.
    - Uses get_current_user dependency to validate JWT token.
    - Returns the user info if token is valid.
    - Returns 401 Unauthorized if token is missing, invalid, expired, or user not in DB.
    """
    return current_user

@router.post("/reset-password")
def reset_password(reset_data: ResetPasswordSchema, db: Session = Depends(get_db)):
    # Public endpoint for password reset using reset_token from /forgot-password.
    # No auth required. Expects reset_token in request body.
    
    return auth_controller.reset_password_controller(db, reset_data.reset_token, reset_data.new_password)