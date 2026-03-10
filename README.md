# 🏢 Workforce Management System with RAG Support

A complete, high-performance Workforce Management System featuring an integrated **RAG (Retrieval-Augmented Generation)** service for intelligent team recommendations and project risk analysis.

## 🚀 Tech Stack

- **Frontend**: React (Vite) + Vanilla CSS (Premium Dark Theme)
- **Backend**: Node.js + Express + MongoDB + JWT
- **RAG Service**: Python FastAPI + SentenceTransformers + FAISS
- **Database**: MongoDB (Local or Atlas)
- **AI Models**: `all-MiniLM-L6-v2` for embeddings

---

## 📂 Project Structure

```text
workforce-system/
├── client/                 # React app for Employee Portal (Port 3000)
├── admin/                  # React app for Admin Dashboard (Port 3001)
├── server/
│    ├── node-api/          # Main Express API (Port 5000)
│    └── rag-python/        # Python RAG Service (Port 8000)
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB (Running locally on `mongodb://localhost:27017/workforce`)

### 2. Backend Setup (Node.js)
```bash
cd server/node-api
npm install
npm run dev
```

### 3. RAG Service Setup (Python)
```bash
cd server/rag-python
pip install -r requirements.txt
python main.py
```

### 4. Admin App Setup
```bash
cd admin
npm install
npm run dev
```
*Login with: `admin` / `admin`*

### 5. Client App Setup
```bash
cd client
npm install
npm run dev
```
*Login with credentials created by Admin (Team Lead account).*

---

## 🤖 RAG Features

1. **Intelligent Team Selection**: When an Admin creates a project, the system analyzes the "Technical Requirements" and "Problem Statement" against the employee database using **FAISS vector search** to recommend the most suitable members.
2. **Project Risk Analysis**: On the Employee Dashboard, the RAG engine generates a real-time risk assessment based on project complexity and team size.
3. **AI Project Assistant**: A dedicated chat box in the Project Detail page allows users to ask complex questions like *"What are the technical risks of this project?"* or *"Who is responsible for the API integration?"* using retrieved project context.

---

## 📝 Credentials
- **Admin**: `admin` / `admin`
- **User (TL)**: Created by Admin during Project Creation.
