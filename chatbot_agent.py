from fastapi import FastAPI, HTTPException
from langchain_groq import ChatGroq
from langchain.agents import create_react_agent, AgentExecutor, tool
from langchain_core.prompts import PromptTemplate
import requests
import json
import re
import uvicorn
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

@tool
def get_api_data():
    """
    Fetches the list of available APIs stored in the database.

    This function makes a GET request to the API endpoint that returns all available APIs.
    Each API entry contains metadata such as the company name, base URL, authentication details,
    headers, and available endpoints.

    Returns:
        list[dict]: A list of dictionaries containing API details if the request is successful.
        dict: A dictionary with an "error" key if the request fails
    """
    url = "https://tenant-aware-chatbot-1.onrender.com/api/all"

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for HTTP errors (4xx, 5xx)
        data = response.json()

        if isinstance(data, list):  # Ensure the response is a list of APIs
            return data
        else:
            return {"error": "Unexpected response format"}

    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

def create_json_from_output(data):
    """
    Processes the retrieved API data and formats it as JSON.

    Args:
        data (list[dict]): The list of APIs retrieved from the database.

    Returns:
        dict: A dictionary containing the structured API and endpoint details.
    """
    structured_data = {
        "apis": []
    }

    # Iterate through each API in the retrieved data
    for api in data:
        api_details = {
            "company_name": api.get("company_name", ""),
            "base_url": api.get("base_url", ""),
            "purpose": api.get("purpose", ""),
            "api_key": api.get("api_key", ""),
            "headers": api.get("headers", {}),
            "auth_type": api.get("auth_type", ""),
            "endpoints": []
        }

        # Iterate through each endpoint in the API
        for endpoint in api.get("endpoints", []):
            endpoint_details = {
                "api_id": endpoint.get("api_id", ""),
                "path": endpoint.get("path", ""),
                "method": endpoint.get("method", ""),
                "purpose": endpoint.get("purpose", ""),
                "params": endpoint.get("params", {}),
                "headers": endpoint.get("headers", {})
            }
            api_details["endpoints"].append(endpoint_details)

        structured_data["apis"].append(api_details)

    return structured_data

# Custom prompt template for JSON output
custom_prompt = """Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: your final answer should be formatted as a valid JSON object with this exact structure and no other thing:
{{
  "api": {{
    "company_name": "name of the API provider",
    "base_url": "the base URL of the API",
    "purpose": "purpose of the API",
    "api_key": "API key if available",
    "headers": {{"key": "value"}},
    "auth_type": "authentication type"
  }},
  "endpoints": [
    {{
      "api_id": "ID of the endpoint",
      "path": "the endpoint path",
      "method": "HTTP method (GET, POST, etc.)",
      "purpose": "purpose of the endpoint",
      "params": {{"key": "value"}},
      "headers": {{"key": "value"}}
    }}
  ]
}}

Begin!

Question: {input}
{agent_scratchpad}
"""

llm = ChatGroq(
    model="mixtral-8x7b-32768",
    temperature=0,  # Adjust based on creativity needed
    max_tokens=None,  # Adjust based on response length needed
    timeout=60,  # Adjust based on your patience for responses
    max_retries=2,  # Adjust based on network reliability
)

# Use the custom prompt template
prompt = PromptTemplate.from_template(custom_prompt)
tools = [get_api_data]

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

class QueryRequest(BaseModel):
    input: str

@app.post("/query/")
async def query_api(request: QueryRequest):
    try:
        # Invoke the agent with the user's query
        response = agent_executor.invoke({"input": request.input})

        # Process the response to extract structured data
        final_answer = response.get('output', '')

        # Replace escaped underscores with regular underscores
        final_answer = final_answer.replace("\\_", "_")

        # Parse the JSON string
        retrieved_data = json.loads(final_answer)
        return retrieved_data

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"JSON Decode Error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing response: {e}")

uvicorn.run(app, host="0.0.0.0", port=8000)