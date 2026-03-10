from pydantic import BaseModel
from typing import List, Optional

class RecommendRequest(BaseModel):
    requirements: str
    deadline: Optional[str] = ""

class AnalyzeRequest(BaseModel):
    project_name: Optional[str] = ""
    company: Optional[str] = ""
    prob_statement: Optional[str] = ""
    requirements: Optional[str] = ""
    members: Optional[List[str]] = []
    question: Optional[str] = ""

class ProjectSummaryRequest(BaseModel):
    project_name: Optional[str] = ""
    company: Optional[str] = ""
    prob_statement: Optional[str] = ""
    requirements: Optional[str] = ""
    members: Optional[List[str]] = []
    status: Optional[str] = ""

class Employee(BaseModel):
    name: Optional[str] = ""
    email: Optional[str] = ""
    skills: Optional[str] = ""
    experience: Optional[int] = 0
    role: Optional[str] = ""
    availability: Optional[str] = "Available"
    past_projects: Optional[str] = ""

