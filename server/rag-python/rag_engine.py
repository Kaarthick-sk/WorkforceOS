from vector_store import search_employees, encode_text, get_model
import numpy as np

def recommend_team(requirements: str, deadline: str, top_k: int = 5) -> dict:
    """Use FAISS to find best-matched employees for project requirements."""
    query = f"Project requirements: {requirements}. Deadline: {deadline}. Need skilled team members."
    matches = search_employees(query, top_k=top_k)

    if not matches:
        return {
            "recommended_members": [],
            "message": "No employees in the system yet. Please add employees first."
        }

    member_names = [m["name"] for m in matches]
    return {
        "recommended_members": member_names,
        "details": matches,
        "message": f"RAG recommended {len(member_names)} team members based on skills and experience."
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
