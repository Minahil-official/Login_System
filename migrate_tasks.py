from config.db import engine, Base
# Import all models so SQLAlchemy knows about them
from app.models.user import User
from app.models.task import Task
from sqlalchemy import text

def migrate_db():
    print("Starting dev migration on login_system.db...")

    with engine.connect() as conn:
        try:
            print("Dropping 'tasks' table if it exists...")
            conn.execute(text("DROP TABLE IF EXISTS tasks"))
            conn.commit()
            print("Old tasks table dropped.")

            print("Creating tables with updated schema...")
            Base.metadata.create_all(bind=engine)  # Creates tasks table properly
            print("Tables created successfully!")

        except Exception as e:
            print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_db()
