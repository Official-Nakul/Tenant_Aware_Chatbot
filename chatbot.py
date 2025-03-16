from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
import json
import re
import requests
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define LLM
llm = ChatGroq(
    model="mixtral-8x7b-32768",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)


# Define request model
class ChatRequest(BaseModel):
    message: str


# Define API request function
def trigger_api(action, robot_id):
    url = "https://multi-robot-control-dashboard.onrender.com/api/robots/command"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": "chat_bot_robot_authentication",
    }
    payload = {"robotId": robot_id, "command": action}

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


@app.post("/chat/")
def chat_with_robot(request: ChatRequest):
    messages = [
        SystemMessage(
            content="You are a smart AI assistant that extracts two values: 'robot_id' and 'action'. "
                    "Output a **valid JSON object** in this exact format: {'robot_id': '<robot_name>', 'action': '<direction>'}. "
                    "Ensure that 'action' contains only the direction (e.g., 'forward', 'backward', 'left', 'right') without additional words like 'move' or 'go'. "
                    "If the action is abbreviated, expand it to its full form (e.g., 'fwd' → 'forward'). "
                    "Do not add extra words or explanations. Respond only with the JSON object, nothing else."
        ),
        HumanMessage(content=request.message),
    ]

    try:
        ai_msg = llm.invoke(messages)
        raw_response = ai_msg.content

        # Fix escape sequences if necessary
        fixed_response = re.sub(r'\\_', '_', raw_response)

        # Ensure valid JSON
        msg = json.loads(fixed_response)

        # Call API to trigger robot action
        api_response = trigger_api(msg["action"], msg["robot_id"])
        return {"llm_response": msg, "api_response": api_response}

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON response from AI.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

