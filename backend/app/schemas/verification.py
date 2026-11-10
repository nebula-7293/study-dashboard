from sqlmodel import SQLModel
from pydantic import EmailStr

class ForgotPasswordRequest(SQLModel):
    email: EmailStr

class ResetPasswordRequest(SQLModel):
    email: EmailStr
    otp: str
    new_password: str

class VerifyEmailRequest(SQLModel):
    email: EmailStr
    otp: str