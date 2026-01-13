# Gemini Login System

A simple FastAPI-based authentication API that supports user signup and login using **bcrypt** password hashing and **JWT** access tokens.

## Features

- User registration (signup)
- User authentication (login)
- Password hashing with bcrypt
- JWT token generation with expiration
- SQLite database via SQLAlchemy
- Interactive API docs via Swagger UI

## Project structure

```text
.
├── main.py
├── login_system.db
├── requirements.txt
├── app/
│   ├── controllers/
│   ├── models/
│   ├── router/
│   ├── services/
│   └── utils/
└── config/
    └── db.py
```

## Setup

### 1) Create and activate a virtual environment

```bash
python -m venv venv

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# Windows (cmd)
venv\Scripts\activate.bat
```

### 2) Install dependencies

> Note: `requirements.txt` exists but may be empty. Install the packages below, then (optionally) freeze them into `requirements.txt`.

```bash
pip install fastapi uvicorn sqlalchemy bcrypt "python-jose[cryptography]" email-validator
```

(Optional) Generate requirements:

```bash
pip freeze > requirements.txt
```

### 3) Run the API

```bash
uvicorn main:app --reload
```

Open:
- API docs (Swagger): `http://127.0.0.1:8000/docs`
- API docs (ReDoc): `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/`

## API Endpoints

### `POST /auth/signup`

Creates a new user.

Example request body:

```json
{
  "email": "user@example.com",
  "username": "user1",
  "first_name": "User",
  "last_name": "One",
  "password": "strong-password"
}
```

### `POST /auth/login`

Authenticates a user and returns a JWT token.

Example request body:

```json
{
  "username": "user1",
  "password": "strong-password"
}
```

Example response:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

## Database

- Uses SQLite stored in `login_system.db`.
- Tables are created automatically on app startup.

## Notes / Security

- The JWT secret key is currently hardcoded in `app/services/auth_services.py`. For real deployments, move it to an environment variable (e.g. `.env`) and keep it out of git.

## License

Add a license if you plan to publish this project.
