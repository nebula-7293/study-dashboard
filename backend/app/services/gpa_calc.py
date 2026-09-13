from backend.app.models.course import Course

def score_to_grade(score: float) -> tuple[str, float]:
    if score >= 91:
        return ("A", 4.0)
    elif score >= 81:
        return ("B", 3.3)
    elif score >= 71:
        return ("C", 2.7)
    elif score >= 61:
        return ("D", 2.0)
    elif score >= 51:
        return ("E", 1.0)
    else:
        return ("Fx", 0.0)

def calculate_gpa(courses: list[Course]):
    total_credits = 0.0
    total_earned_credits = 0.0
    total_avg_eu = 0.0
    total_avg_us = 0.0

    for course in courses:
        credits = course.credits or 0.0
        total_credits += credits

        if course.current_grade is not None:
            letter, us_grade = score_to_grade(course.current_grade)
            total_avg_eu += (course.current_grade * credits)
            total_avg_us += (us_grade * credits)
            total_earned_credits += credits

    if total_earned_credits == 0:
        return {"ects_average": 0.0, "ects_letter": "N/A", "gpa_average": 0.0, "total_credits": total_credits, "earned_credits": 0.0}

    ects_avg = round(total_avg_eu/total_earned_credits, 2)
    gpa_avg = round(total_avg_us/total_earned_credits, 2)
    ects_letter = score_to_grade(ects_avg)[0]

    return {
        "ects_average": ects_avg,
        "ects_letter": ects_letter,
        "gpa_average": gpa_avg,
        "total_credits": total_credits,
        "earned_credits": total_earned_credits
    }

        

