from sqlalchemy.orm import Session
from starlette.background import BackgroundTasks
from app.services import auth_services

def signup_controller(db: Session, user_data, background_tasks: BackgroundTasks):
    # user_data is the UserSchema object from the router
    return auth_services.signup_user(
        db,
        user_data.email,
        user_data.username,
        user_data.first_name,
        user_data.last_name,
        user_data.password,
        background_tasks
    )

def login_controller(db: Session, email: str, password: str):
    user = auth_services.authenticate_user(db, email, password)
    if not user:
        return None

    # Create JWT tokens
    access_token = auth_services.create_access_token(data={"sub": user.email})
    refresh_token = auth_services.create_refresh_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }

def verify_email_controller(db: Session, token: str):
    return auth_services.verify_email_service(db, token)

def forgot_password_controller(db: Session, user_data):
    # This controller handles the business logic coordination for forgot password.
    # It calls the service layer to process the forgot password request.
    # user_data is the schema object containing the email.

    # We pass the email to the service function.
    result = auth_services.forgot_password_service(db, user_data.email)

    # We return the result from the service, which could be a success message or None if user not found.
    return result

def logout_controller(db: Session):
    # This controller handles the business logic for logout.
    # It delegates the specific logout actions to the service layer.

    return auth_services.logout_service(db)

def change_password_controller(db: Session, user, password_data):
    return auth_services.change_password_service(
        db,
        user,
        password_data.old_password,
        password_data.new_password
    )

def reset_password_controller(db: Session, reset_token: str, new_password: str):
    # \"\"\"Controller for password reset endpoint - delegates to service.\"\"\"
    return auth_services.reset_password_service(db, reset_token, new_password)
