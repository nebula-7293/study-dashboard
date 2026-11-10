from backend.app.models.verification import Verification
from backend.app.services.email import generate_otp, send_email

def test_generate_otp():
    otp = generate_otp()
    assert isinstance(otp, str)
    assert len(otp) == 6
    assert otp.isdigit()
    assert 0 <= int(otp) < 1000000

def test_randomness_otp():
    otp1 = generate_otp()
    otp2 = generate_otp()
    assert otp1 != otp2

def test_send_email(capsys):
    test_recipient = "student@example.com"
    test_subject = "Your StudyPulse OTP Code"
    test_body = "Your verification code is: 849201"

    send_email(to_email=test_recipient, subject=test_subject, body=test_body)
    captured = capsys.readouterr()

    assert f"To: {test_recipient}" in captured.out
    assert f"Subject: {test_subject}" in captured.out
    assert test_body in captured.out