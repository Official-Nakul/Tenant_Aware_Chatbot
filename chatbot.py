from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
import json
import re  # For fixing escape sequences if needed
import requests
load_dotenv()

llm = ChatGroq(
    model="mixtral-8x7b-32768",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

messages = [
    SystemMessage(
        content="You are a smart AI assistant that extracts two values: 'robot_id' and 'action'. "
                "Output a **valid JSON object** in this exact format: {'robot_id': '<robot_name>', 'action': '<direction>'}. "
                "Ensure that 'action' contains only the direction (e.g., 'forward', 'backward', 'left', 'right') without additional words like 'move' or 'go'. "
                "If the action is abbreviated, expand it to its full form (e.g., 'fwd' → 'forward'). "
                "Do not add extra words or explanations. Respond only with the JSON object, nothing else."
    ),
    HumanMessage(content="make optimusPrime move fwd"),
]

ai_msg = llm.invoke(messages)

raw_response = ai_msg.content
print("Raw AI Response:", raw_response)  # Debugging step

# Fix incorrect escape sequences (if any)
fixed_response = re.sub(r'\\_', '_', raw_response)  # Replaces `\_` with `_`

# Ensure it's valid JSON before parsing
try:
    msg = json.loads(fixed_response)  # Use `json.loads()` to parse string JSON
    print("Parsed JSON:", msg)  # Print parsed dictionary
except json.JSONDecodeError as e:
    print("JSON Decoding Error:", e)
    print("Fixed Response:", fixed_response)

def trigger_api(action, robot_id):
    url = "https://multi-robot-control-dashboard.onrender.com/api/robots/commands"  # Ensure this URL is correct
    headers = {
        "Content-Type": "application/json",
        "x-api-key": "push_server_robot_authentication",  # Ensure this key is valid
    }
    payload = {"robotId": robot_id, "command": action}  # Match the expected format

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raises an exception for HTTP errors (4xx, 5xx)
        print(response.json())  # Print response JSON if successful
    except requests.exceptions.RequestException as e:
        print("API call failed:", e)

if len(msg) > 0:
    trigger_api(msg["action"], msg["robot_id"])
