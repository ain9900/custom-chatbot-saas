from cryptography.fernet import Fernet
from django.conf import settings

def encrypt_text(raw: str) -> str:
    f = Fernet(settings.FERNET_KEY.encode())
    return f.encrypt(raw.encode()).decode()

def decrypt_text(enc: str) -> str:
    f = Fernet(settings.FERNET_KEY.encode())
    return f.decrypt(enc.encode()).decode()
