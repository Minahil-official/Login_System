from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The database file will be created in your root folder
DATABASE_URL = "sqlite:///./login_system.db"

# connect_args is needed only for SQLite            
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Each instance of SessionLocal will be a database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models
Base = declarative_base()

# Dependency to get the DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


