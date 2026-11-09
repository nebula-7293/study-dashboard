from backend.app.services.security import hash_password, verify_password, create_access_token

import jwt
from backend.app.services.security import SECRET_KEY, ALGORITHM


def test_hash_password():
    plaintext = "my_secure_password"
    hashed = hash_password(plaintext)

    assert isinstance(hashed, str)
    assert hashed != plaintext
    assert hashed.startswith("$argon2id$")


def test_verify_password():
    plaintext = "my_secure_password"
    hashed = hash_password(plaintext)

    assert verify_password(hashed, plaintext) is True

    assert verify_password(hashed, "wrong_password") is False


def test_create_access_token():
    payload_data = {"sub": "student@example.com"}
    token = create_access_token(data=payload_data)

    assert isinstance(token, str)

    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["sub"] == "student@example.com"
    assert "exp" in decoded