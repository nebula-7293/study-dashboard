from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="StudyPulse API",
    description="Backend engine for the StudyPulse student dashboard",
    version="1.0.0"
)

# Enable CORS so your frontend (HTML/JS) can make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify the server is running."""
    return {
        "status": "healthy",
        "message": "StudyPulse backend engine is running!"
    }