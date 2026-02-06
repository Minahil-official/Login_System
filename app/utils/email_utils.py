import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from starlette.background import BackgroundTasks

# Configuration
# In a real application, using a .env file is recommended
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "user@example.com"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "password"),
    MAIL_FROM = os.getenv("MAIL_FROM", "noreply@example.com"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.example.com"),
    MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "FastAPI App"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

def send_verification_email(email: EmailStr, token: str, background_tasks: BackgroundTasks):
    # Adjust the base URL as needed for your environment
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    verification_link = f"{base_url}/auth/verify-email?token={token}"

    html = f"""
    <html>
        <body>
            <p>Hi,</p>
            <p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
            <p><a href="{verification_link}">Verify Email</a></p>
            <p>Or verify using this link: {verification_link}</p>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Verify your email",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)

    # We use background_tasks to send the email asynchronously
    # Note: send_message is an async method
    background_tasks.add_task(fm.send_message, message)
