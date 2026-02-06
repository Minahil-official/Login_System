from fastapi import FastAPI
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.router import auth_router, task_router, agent_router
from config.db import engine, Base
from app.models import user, task, agent  # Required for table creation

# This command creates the database tables automatically
import os
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

# Customizing Swagger UI to handle Bearer Token better
app = FastAPI(
    title="Gemini Secure Login",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
        "clientId": "gemini-client",
    },
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This is just optional metadata to help Swagger understand we use Bearer tokens
# The real security is enforced in the routers via Depends(get_current_user)

# Include the routes from the router file
app.include_router(auth_router.router)
app.include_router(task_router.router)
app.include_router(agent_router.router)

# Mount static files from frontend build
# Ensure the directory exists before mounting to avoid errors
if os.path.exists("frontend/dist/assets"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

@app.get("/")
def serve_root():
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")
    return {"status": "Frontend not built. Run 'npm run build' in frontend directory."}

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # If the path starts with api/ docs/ or openapi.json, we should let it 404 naturally
    # if it wasn't caught by the routers above.
    # But since this is a catch-all, it WILL catch missing API routes.
    # We don't want to return HTML for missing API endpoints.
    if full_path.startswith("api") or full_path.startswith("docs") or full_path == "openapi.json":
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")

    # Check for specific static files in root (like favicon.ico, manifestation.json)
    possible_path = os.path.join("frontend/dist", full_path)
    if os.path.exists(possible_path) and os.path.isfile(possible_path):
        return FileResponse(possible_path)

    # For any other route (client-side routing), return index.html
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")

    return {"status": "Frontend not built."}
