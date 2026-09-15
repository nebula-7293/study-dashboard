from datetime import date, timedelta

from backend.app.models.schedule import Schedule
from backend.app.enums import RepeatFrequency

def reccuring_schedule(schedules: list[Schedule], start_date: date, end_date: date) -> list[dict]:
    result = []
    for occasion in schedules:
        if occasion.repeat == RepeatFrequency.NONE:
            if start_date <= occasion.day <= end_date:
                result.append()
        if occasion.repeat == RepeatFrequency.DAILY:
            current = occasion.day
            while current <= end_date:
                result.append()
            current += timedelta(days=1)
        if occasion.repeat == RepeatFrequency.WEEKLY:
            current = occasion.day
            while current <= end_date:
                result.append()
            current += timedelta(days=7)
    result.sort(key=lambda x: (x['day'], x['start_time']))
    return result