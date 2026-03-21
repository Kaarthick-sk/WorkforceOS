import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

from models import RecommendRequest, AnalyzeRequest, ProjectSummaryRequest
from vector_store import build_index
from rag_engine import recommend_team, analyze_project_rag, summarize_project

app = FastAPI(
    title="Workforce RAG Service",
    description="RAG-powered API for workforce management using FAISS + SentenceTransformers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory employee store for RAG (populated from Node API on demand)
_employee_cache = []


@app.get("/")
def root():
    return {"message": "Workforce RAG Service is running.", "status": "healthy"}


@app.get("/health")
def health():
    return {"status": "RAG service running", "model": os.getenv("MODEL_NAME")}


@app.post("/load-employees")
def load_employees(employees: List[dict] = Body(...)):
    """Load employees into FAISS index."""
    global _employee_cache
    _employee_cache = employees
    build_index(employees)
    return {"message": f"Loaded {len(employees)} employees into FAISS index."}


    build_index(employees)
    return {"message": f"Loaded {len(employees)} employees into FAISS index."}


@app.post("/recommend-members")


@app.post("/recommend-members")
def recommend_members(request: RecommendRequest):
    """
    Recommend team members for a project based on requirements and deadline.
    Uses FAISS vector similarity search on employee embeddings.
    """
    try:
        if not _employee_cache:
            # Return a graceful response when no employees are loaded
            return {
                "recommended_members": [],
                "details": [],
                "message": "No employees loaded in RAG index. Please add employees first via /load-employees."
            }

        result = recommend_team(
            requirements=request.requirements,
            deadline=request.deadline or "",
            employee_statuses=request.employee_statuses or []
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG recommendation error: {str(e)}")


@app.post("/analyze-project")
def analyze_project(request: AnalyzeRequest):
    """
    Analyze a project and answer questions using RAG context retrieval.
    """
    try:
        print(f"📊 Projects received for analysis: {len(request.projects or [])}")
        result = analyze_project_rag(
            project_name=request.project_name or "",
            company=request.company or "",
            prob_statement=request.prob_statement or "",
            requirements=request.requirements or "",
            members=request.members or [],
            question=request.question or "What is the overview of this project?",
            all_projects=request.projects or []
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG analysis error: {str(e)}")


@app.post("/project-summary")
def project_summary(request: ProjectSummaryRequest):
    """
    Generate a risk analysis summary for a project.
    """
    try:
        result = summarize_project(
            project_name=request.project_name or "",
            company=request.company or "",
            prob_statement=request.prob_statement or "",
            requirements=request.requirements or "",
            members=request.members or [],
            status=request.status or "Active"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG summary error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
