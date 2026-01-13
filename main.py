from fastapi import FastAPI
from app.router import auth_router
from config.db import engine, Base
from app.models import user # Required for table creation

# This command creates the database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gemini Secure Login")

# Include the routes from the router file
app.include_router(auth_router.router)

@app.get("/")
def home():
    return {"status": "API is working! Go to /docs for Swagger UI"}
