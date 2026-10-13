import logging
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from typing import Optional

logger = logging.getLogger("medikiosk.audit")

def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    try:
        audit_entry = AuditLog(
            user_id=user_id,
            patient_id=patient_id,
            action=action,
            details=details,
            ip_address=ip_address
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        db.rollback()
