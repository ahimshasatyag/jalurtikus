from typing import Optional, Dict, Any, List
from app.core.config import settings

# Data hanya akan terisi secara dinamis melalui request API riil atau integrasi database
MEMORY_STORE: Dict[str, Dict[str, Any]] = {
    "users": {},
    "trips": {},
    "routes": {},
    "incidents": {},
    "user_reports": {}
}


class BaseRepository:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def find_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        return MEMORY_STORE.get(self.table_name, {}).get(item_id)

    def save(self, item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.table_name not in MEMORY_STORE:
            MEMORY_STORE[self.table_name] = {}
        MEMORY_STORE[self.table_name][item_id] = data
        return data

    def list_all(self) -> List[Dict[str, Any]]:
        return list(MEMORY_STORE.get(self.table_name, {}).values())

    def delete(self, item_id: str) -> bool:
        if self.table_name in MEMORY_STORE and item_id in MEMORY_STORE[self.table_name]:
            del MEMORY_STORE[self.table_name][item_id]
            return True
        return False
