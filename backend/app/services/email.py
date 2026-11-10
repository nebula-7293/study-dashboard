import secrets

def generate_otp() -> str:
    """Generate a 6-digit OTP code"""
    return f"{secrets.randbelow(1_000_000):06d}"

def send_email(to_email: str, subject: str, body: str):
    """Send an email"""
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body:\n{body}")