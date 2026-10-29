from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = []

class ToolCallLog(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    result_summary: str

class ChatResponse(BaseModel):
    reply: str
    tools_executed: List[ToolCallLog]
    suggested_action: Optional[Dict[str, Any]] = None
