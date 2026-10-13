from datetime import datetime, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.patient import Patient
from app.models.visit import Visit
from app.models.clinical_summary import ClinicalSummary
from app.models.document import MedicalDocument

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])

@router.get("/doctor")
def get_doctor_dashboard_stats(db: Session = Depends(get_db)):
    total_patients = db.query(Patient).count()
    
    # Priority counts from all active/recent visits
    high_priority = db.query(Visit).filter(Visit.priority == "red_flag").count()
    attention = db.query(Visit).filter(Visit.priority == "attention").count()
    monitor = db.query(Visit).filter(Visit.priority == "monitor").count()
    routine = db.query(Visit).filter(Visit.priority == "routine").count()
    
    # AI Summaries ready vs verified
    ai_summaries_total = db.query(ClinicalSummary).count()
    ai_summaries_verified = db.query(ClinicalSummary).filter(ClinicalSummary.is_doctor_verified == True).count()
    
    # Department breakdown for chart
    dept_counts = db.query(Visit.department, func.count(Visit.id)).group_by(Visit.department).all()
    departments = [{"department": d[0], "count": d[1]} for d in dept_counts]
    
    # Priority breakdown for chart
    priorities = [
        {"name": "High Priority", "count": high_priority, "color": "#A83A2D"},
        {"name": "Attention", "count": attention, "color": "#B9740E"},
        {"name": "Monitoring", "count": monitor, "color": "#9C7F14"},
        {"name": "Routine", "count": routine, "color": "#2E7D5B"}
    ]
    
    return {
        "total_patients": total_patients,
        "high_priority": high_priority,
        "needs_review": attention,
        "monitoring": monitor,
        "routine": routine,
        "ai_summaries_ready": ai_summaries_total,
        "ai_summaries_verified": ai_summaries_verified,
        "departments": departments,
        "priorities": priorities
    }

@router.get("/staff")
def get_staff_dashboard_stats(db: Session = Depends(get_db)):
    in_kiosk = db.query(Visit).filter(Visit.status == "in_kiosk").count()
    red_flags = db.query(Visit).filter(Visit.is_red_flag == True).count()
    awaiting_review = db.query(Visit).filter(Visit.status == "awaiting_review").count()
    completed_today = db.query(Visit).filter(Visit.status == "completed").count()
    total_documents = db.query(MedicalDocument).count()
    
    return {
        "in_kiosk": in_kiosk,
        "red_flag_alerts": red_flags,
        "awaiting_doctor_review": awaiting_review,
        "completed_today": completed_today,
        "total_documents": total_documents
    }
