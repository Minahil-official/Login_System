from config.db import engine, Base
from sqlalchemy import text
from app.models.task import Task
from app.models.agent import Agent

def migrate_db():
    print("Migrating database for Agents...")
    with engine.connect() as conn:
        try:
            print("Dropping old 'agents' table (and 'task_agents' if exists)...")
            conn.execute(text("DROP TABLE IF EXISTS agents"))
            conn.execute(text("DROP TABLE IF EXISTS task_agents"))
            conn.commit()
            print("Old tables dropped.")

            print("Creating new tables...")
            Base.metadata.create_all(bind=engine)
            print("Migration complete! 'agents' table created.")
        except Exception as e:
            print(f"Error migrating: {e}")

if __name__ == "__main__":
    migrate_db()
