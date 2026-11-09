from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.app.database import create_db
from backend.app.routers import task
from backend.app.routers import deadline
from backend.app.routers import course
from backend.app.routers import schedule
from backend.app.routers import auth

app = FastAPI(
    title="StudyPulse API",
    description="Backend engine for the StudyPulse student dashboard",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db()

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "StudyPulse backend engine is running!"}

app.include_router(task.router)
app.include_router(deadline.router)
app.include_router(course.router)
app.include_router(schedule.router)
app.include_router(auth.router)

# Mount frontend static files AFTER all API routers so /api/* is never shadowed
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")