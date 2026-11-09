try:
    from enum import StrEnum
except ImportError:
    from enum import Enum

class StrEnum(str, Enum):
    pass

class Scope(StrEnum):
    UNI = "uni"
    PERSONAL = "personal"

class Urgency(StrEnum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class DeadlineType(StrEnum):
    ASSIGNMENT = "assignment"
    EXAM = "exam"

class Weekdays(StrEnum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class Occasion(StrEnum):
    LECTURE = "Lecture"
    LAB = "Lab"
    SEMINAR = "Seminar"
    MISCELLANEOUS = "Miscellaneous"
    WORK = "Work"

class RepeatFrequency(StrEnum):
    NONE = "None"
    DAILY = "Daily"
    WEEKLY = "Weekly"