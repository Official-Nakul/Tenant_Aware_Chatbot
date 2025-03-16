import React, { useState } from "react";
import { Card, CardFooter, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Image as ImageIcon } from "lucide-react";

export function Chat() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      type: "text",
      content: "Hello! I'm your AI assistant. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add the user's message to the chat
    const userMessage = {
      id: messages.length + 1,
      sender: "human",
      type: "text",
      content: inputValue,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");

    // Send the message to the FastAPI backend
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://tenant-aware-chatbot.onrender.com/chat/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: inputValue }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch response from the API");
      }

      const data = await response.json();

      // Add the bot's response to the chat
      const botMessage = {
        id: messages.length + 2,
        sender: "bot",
        type: "text",
        content: `Action: ${data.llm_response.action}, Robot: ${
          data.llm_response.robot_id
        }. API Response: ${JSON.stringify(data.api_response)}`,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error fetching response from the API:", error);
      const errorMessage = {
        id: messages.length + 2,
        sender: "bot",
        type: "text",
        content: "Sorry, I couldn't process your request. Please try again.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="rounded-none relative h-full flex flex-col pb-0">
        <CardContent className="overflow-y-auto p-4 flex-grow">
          <div className="flex flex-col space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "human" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg overflow-hidden ${
                    message.sender === "human"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <div className="p-3">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-black rounded-lg p-3">
                  Typing...
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="self-end w-full sticky bottom-0 bg-white border-t flex-col p-3">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              type="text"
              placeholder="Ask AI"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  );
}
