import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, documents, rag, agent, tasks

app = FastAPI(
    title="ORBIT AI - Python AI Service",
    description="Dedicated AI service handling document extraction, TF-IDF retrieval, agent loop, and model abstraction.",
    version="1.0.0"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router, tags=["Health"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(rag.router, prefix="/retrieval", tags=["RAG & Retrieval"])
app.include_router(agent.router, prefix="/agent", tags=["Agent"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])

@app.get("/")
def root():
    return {
        "message": "ORBIT AI Python Service is operational",
        "docs_url": "/docs",
        "provider": os.getenv("AI_PROVIDER", "demo")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
