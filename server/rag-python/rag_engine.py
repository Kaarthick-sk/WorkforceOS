from vector_store import search_employees, encode_text, get_model
import numpy as np

def recommend_team(requirements: str, deadline: str, employee_statuses: list = None, top_k: int = 10) -> dict:
    """Use FAISS to find best-matched employees for project requirements with commitment filtering."""
    query = f"Project requirements: {requirements}. Deadline: {deadline}. Need skilled team members."
    
    # Get all potential matches from FAISS
    # We get more than top_k because we might filter some out
    matches = search_employees(query, top_k=50) 

    if not matches:
        return {
            "recommended_members": [],
            "message": "No employees in the system yet. Please add employees first."
        }

    # Map employee status for quick lookup
    status_map = {s.name: s for s in employee_statuses} if employee_statuses else {}

    scored_matches = []
    for m in matches:
        name = m["name"]
        status = status_map.get(name)
        
        # PART 7.1: EXCLUDE employees who are TL in another active project
        if status and status.is_tl:
            continue
            
        # PART 8: availability_score
        # very_less -> 1.0, partial -> 0.5, full -> 0.1, none -> 1.0
        commitment = status.commitment if status else "none"
        availability_score = 1.0
        if commitment == "full":
            availability_score = 0.1
        elif commitment == "partial":
            availability_score = 0.5
        elif commitment == "very_less":
            availability_score = 1.0
            
        # PART 8: final score calculation
        # score = skill_match * 0.5 + experience * 0.2 + availability_score * 0.3
        # m["score"] from vector_store is the skill_match (cosine similarity/inverse distance)
        skill_match = m["score"]
        experience_normalized = min(m["experience"] / 15.0, 1.0) # Normalize experience up to 15 years
        
        final_score = (skill_match * 0.5) + (experience_normalized * 0.2) + (availability_score * 0.3)
        m["final_score"] = final_score
        scored_matches.append(m)

    # Sort by final score descending
    scored_matches.sort(key=lambda x: x["final_score"], reverse=True)
    top_matches = scored_matches[:top_k]

    member_names = [m["name"] for m in top_matches]
    return {
        "recommended_members": member_names,
        "details": top_matches,
        "message": f"RAG recommended {len(member_names)} team members based on skills, experience, and availability."
    }


def analyze_project_rag(project_name: str, company: str, prob_statement: str,
                         requirements: str, members: list, question: str) -> dict:
    """Retrieve relevant context and generate analysis response."""
    context_parts = []

    if project_name:
        context_parts.append(f"Project: {project_name}")
    if company:
        context_parts.append(f"Company: {company}")
    if prob_statement:
        context_parts.append(f"Problem Statement: {prob_statement}")
    if requirements:
        context_parts.append(f"Requirements: {requirements}")
    if members:
        context_parts.append(f"Team Members: {', '.join(members)}")

    context = ". ".join(context_parts)

    # Retrieve related employees for context enrichment
    if requirements:
        related = search_employees(requirements, top_k=3)
        if related:
            skills_context = ", ".join([f"{r['name']} ({r['skills']})" for r in related])
            context += f". Related skilled employees: {skills_context}"

    # Generate rule-based intelligent response
    response = generate_analysis_response(question, context, project_name, prob_statement, requirements, members)

    return {
        "question": question,
        "response": response,
        "context_used": context[:500] + "..." if len(context) > 500 else context
    }


def generate_analysis_response(question: str, context: str, project_name: str,
                                 prob_statement: str, requirements: str, members: list) -> str:
    """Generate meaningful response based on project context."""
    q_lower = question.lower() if question else ""

    if any(word in q_lower for word in ["risk", "challenge", "problem", "issue"]):
        return (
            f"**Risk Analysis for {project_name}:**\n\n"
            f"Based on the problem statement — *{prob_statement}* — the key risks include:\n\n"
            f"• **Technical Risk**: Complex requirements like {requirements[:100]}... may require specialized expertise.\n"
            f"• **Resource Risk**: Team of {len(members)} members must be carefully coordinated.\n"
            f"• **Timeline Risk**: Meeting deadlines requires clear milestone definitions.\n"
            f"• **Scope Creep**: Problem statement complexity suggests close requirement management.\n\n"
            f"**Mitigation**: Regular sprints, clear documentation, and iterative testing are recommended."
        )
    elif any(word in q_lower for word in ["team", "member", "who"]):
        if members:
            return (
                f"**Team Composition for {project_name}:**\n\n"
                f"The project has {len(members)} assigned members: {', '.join(members)}.\n\n"
                f"Based on the requirements ({requirements[:80]}...), the team covers the necessary skill sets. "
                f"Ensure roles are clearly defined with a designated Team Lead coordinating tasks."
            )
        return f"No team members have been assigned to {project_name} yet. Use the RAG recommendation system to suggest the ideal team."
    elif any(word in q_lower for word in ["progress", "status", "complete", "done"]):
        return (
            f"**Progress Assessment for {project_name}:**\n\n"
            f"Project is currently active. Based on the requirements scope, focus areas should include:\n"
            f"1. Requirement validation with {members[0] if members else 'Team Lead'}\n"
            f"2. Technical architecture design\n"
            f"3. Iterative development with regular reviews\n"
            f"4. Testing and quality assurance\n\n"
            f"Regular communication between all {len(members)} team members is critical for on-time delivery."
        )
    elif any(word in q_lower for word in ["recommend", "suggest", "improve", "better"]):
        return (
            f"**Recommendations for {project_name}:**\n\n"
            f"• Define clear acceptance criteria for: {requirements[:80]}...\n"
            f"• Schedule weekly stand-ups with the {len(members)}-member team\n"
            f"• Use version control and CI/CD pipelines\n"
            f"• Document the problem statement evolution regularly\n"
            f"• Set up monitoring and feedback loops early in development"
        )
    else:
        return (
            f"**Project Analysis — {project_name}:**\n\n"
            f"**Company**: {context.split('Company: ')[1].split('.')[0] if 'Company:' in context else 'N/A'}\n"
            f"**Problem**: {prob_statement[:200] if prob_statement else 'Not specified'}\n"
            f"**Team Size**: {len(members)} members\n"
            f"**Requirements Summary**: {requirements[:150] if requirements else 'Not specified'}...\n\n"
            f"This project addresses a well-defined problem scope. The assigned team should focus on "
            f"iterative delivery, clear documentation, and stakeholder alignment throughout the project lifecycle."
        )


def summarize_project(project_name: str, company: str, prob_statement: str,
                       requirements: str, members: list, status: str) -> dict:
    """Generate a risk and summary analysis for the project."""
    risk_level = "High" if len(members) < 2 else ("Medium" if len(members) < 4 else "Low")
    risk_color = {"High": "🔴", "Medium": "🟡", "Low": "🟢"}[risk_level]

    summary = (
        f"**{risk_color} Project Risk Analysis — {project_name}**\n\n"
        f"**Client**: {company} | **Status**: {status}\n\n"
        f"**Problem Scope**: {prob_statement[:200] if prob_statement else 'Not defined'}...\n\n"
        f"**Risk Level**: {risk_level}\n"
        f"**Team Strength**: {len(members)} member(s) — "
        f"{'Understaffed, consider adding more members.' if len(members) < 3 else 'Adequately staffed.'}\n\n"
        f"**Key Requirements**: {requirements[:150] if requirements else 'Not specified'}...\n\n"
        f"**Recommendations**:\n"
        f"• {'⚠️ Urgently expand the team' if risk_level == 'High' else '✅ Maintain current team composition'}\n"
        f"• Ensure daily syncs and clear deliverables\n"
        f"• Track milestones against the project deadline"
    )

    return {
        "summary": summary,
        "risk_level": risk_level,
        "team_size": len(members),
        "status": status
    }
