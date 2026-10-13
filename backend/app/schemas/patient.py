from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class AllergyBase(BaseModel):
    allergen: str
    reaction: Optional[str] = None
    severity: str = "Moderate"
    identified_date: Optional[str] = None

class AllergyCreate(AllergyBase):
    pass

class AllergyOut(AllergyBase):
    id: int
    verified_by_doctor: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ChronicConditionBase(BaseModel):
    condition_name: str
    icd10_code: Optional[str] = None
    diagnosed_date: Optional[str] = None
    status: str = "Active"

class ChronicConditionCreate(ChronicConditionBase):
    pass

class ChronicConditionOut(ChronicConditionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MedicationBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str = "Once daily"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    is_active: bool = True

class MedicationCreate(MedicationBase):
    pass

class MedicationOut(MedicationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PatientBase(BaseModel):
    full_name: str = Field(..., min_length=2)
    dob: Optional[date] = None
    age: Optional[int] = Field(None, ge=0, le=125)
    gender: str
    blood_group: Optional[str] = "Not recorded"
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    address: Optional[str] = None
    consent_agreed: bool = True

class PatientCreate(PatientBase):
    allergies: Optional[List[AllergyCreate]] = []
    chronic_conditions: Optional[List[ChronicConditionCreate]] = []
    medications: Optional[List[MedicationCreate]] = []

class PatientOut(PatientBase):
    id: int
    patient_uid: str
    created_at: datetime
    updated_at: datetime
    allergies: List[AllergyOut] = []
    chronic_conditions: List[ChronicConditionOut] = []
    medications: List[MedicationOut] = []

    class Config:
        from_attributes = True

class PatientDuplicateCheck(BaseModel):
    phone: str
    full_name: Optional[str] = None

class PatientSearchResult(BaseModel):
    id: int
    patient_uid: str
    full_name: str
    age: Optional[int] = None
    gender: str
    phone: str
    blood_group: Optional[str] = None
    last_visit_date: Optional[str] = None
    chronic_conditions_summary: Optional[str] = None

    class Config:
        from_attributes = True
