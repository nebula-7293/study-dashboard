from enum import StrEnum

class Scope(StrEnum):
    UNI = "uni"
    PERSONAL = "personal"

class Urgency(StrEnum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class DeadlineType(StrEnum):
    ASSIGMENT = "assigment"
    EXAM = "exam"

class Weekdays(StrEnum):
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"
    Saturday = "Saturday"
    Sunday = "Sunday"