import hmac
import hashlib

def verify_hmac_signature(secret: str, body: bytes, signature: str) -> bool:
    mac = hmac.new(secret.encode(), body, hashlib.sha256)
    expected = mac.hexdigest()
    return hmac.compare_digest(expected, signature)
