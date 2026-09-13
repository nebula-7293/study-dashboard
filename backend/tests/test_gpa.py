from backend.app.models.course import Course
from backend.app.services.gpa_calc import score_to_grade, calculate_gpa

def test_score_to_grade():

    assert score_to_grade(100) == ("A", 4.0)
    assert score_to_grade(91) == ("A", 4.0)
    assert score_to_grade(80) == ("C", 2.7)
    assert score_to_grade(50) == ("Fx", 0.0)

def test_calculate_gpa():
    courses = [
        Course(title="Math", credits=6, current_grade=90),
        Course(title="CS", credits=6, current_grade=60)
    ]

    result = calculate_gpa(courses)

    assert result["ects_average"] == 75
    assert result["ects_letter"] == "C"
    assert result["gpa_average"] == 2.15
    assert result["total_credits"] == 12
    assert result["earned_credits"] == 12
    
def test_calculate_gpa_inprogress():
    courses = [
        Course(title="Math", credits=6, current_grade=90),
        Course(title="CS", credits=6, current_grade=None)
    ]

    result = calculate_gpa(courses)

    assert result["ects_average"] == 90
    assert result["ects_letter"] == "B"
    assert result["gpa_average"] == 3.3
    assert result["total_credits"] == 12
    assert result["earned_credits"] == 6

def test_calculate_gpa_failed():
    result = calculate_gpa([])

    assert result["ects_average"] == 0.0
    assert result["ects_letter"] == "N/A"
    assert result["gpa_average"] == 0.0
    assert result["earned_credits"] == 0.0
    


# "ects_average"
# "ects_letter"
# "gpa_average"
# "total_credits"
# "earned_credits"