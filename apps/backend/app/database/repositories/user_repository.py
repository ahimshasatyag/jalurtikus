from typing import Optional, Dict, Any
from app.database.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        for user in self.list_all():
            if user.get("email") == email:
                return user
        return None


user_repository = UserRepository()

