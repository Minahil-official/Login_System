from sqlalchemy.orm import Session
from app.services import auth_services

def signup_controller(db: Session, user_data):
    # user_data is the UserSchema object from the router
    return auth_services.signup_user(
        db,
        user_data.email,
        user_data.username,
        user_data.first_name,
        user_data.last_name,
        user_data.password
    )

def login_controller(db: Session, user_data):
    user = auth_services.authenticate_user(db, user_data.email, user_data.password)
    if not user:
        return None

    # Create the JWT token (Stateless Auth)
    token = auth_services.create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }