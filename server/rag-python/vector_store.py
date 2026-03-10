import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

# Global FAISS index and employee store
_index = None
_employees = []
_model = None

def get_model():
    global _model
    if _model is None:
        print(f"Loading embedding model: {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def build_index(employees: list):
    """Build FAISS index from employee list."""
    global _index, _employees
    _employees = employees

    if not employees:
        _index = None
        return

    model = get_model()
    texts = []
    for emp in employees:
        text = f"{emp.get('name', '')} skills: {emp.get('skills', '')} experience: {emp.get('experience', 0)} years role: {emp.get('role', '')} past projects: {emp.get('past_projects', '')}"
        texts.append(text)

    embeddings = model.encode(texts, convert_to_numpy=True)
    embeddings = embeddings.astype('float32')

    dim = embeddings.shape[1]
    _index = faiss.IndexFlatL2(dim)
    _index.add(embeddings)
    print(f"FAISS index built with {len(employees)} employees.")

def search_employees(query: str, top_k: int = 5):
    """Search FAISS for top-k employees matching query."""
    global _index, _employees
    if _index is None or not _employees:
        return []

    model = get_model()
    query_vec = model.encode([query], convert_to_numpy=True).astype('float32')
    distances, indices = _index.search(query_vec, min(top_k, len(_employees)))

    results = []
    for idx, dist in zip(indices[0], distances[0]):
        if idx < len(_employees):
            emp = _employees[idx]
            results.append({
                "name": emp.get("name", ""),
                "skills": emp.get("skills", ""),
                "experience": emp.get("experience", 0),
                "role": emp.get("role", ""),
                "score": float(1 / (1 + dist))
            })
    return results

def encode_text(text: str):
    """Encode a single text."""
    model = get_model()
    return model.encode([text], convert_to_numpy=True)[0]
