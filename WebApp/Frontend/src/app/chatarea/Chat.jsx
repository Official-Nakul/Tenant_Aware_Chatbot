import React, { useState, useRef, useEffect } from "react";
import { Card, CardFooter, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";

// API URL configuration - change this when deploying
const API_URL = "https://tenant-aware-chatbot-agent.onrender.com/query/";
// const API_URL = "http://localhost:8000/query/";

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
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: "human",
      type: "text",
      content: inputValue,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue("");

    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: inputValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from the API");
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Create a more structured bot response
      const botMessages = [];

      // First add the main response text if available
      if (data.api_response?.response) {
        botMessages.push({
          id: Date.now() + 1,
          sender: "bot",
          type: "text",
          content: data.api_response.response,
        });
      }

      // Then add the API details (always visible)
      if (data.api_info) {
        botMessages.push({
          id: Date.now() + 2,
          sender: "bot",
          type: "api_details",
          content: data.api_info,
          api_response: data.api_response,
        });
      }

      setMessages((prevMessages) => [...prevMessages, ...botMessages]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now(),
          sender: "bot",
          type: "text",
          content: "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (message) => {
    switch (message.type) {
      case "text":
        return (
          <ReactMarkdown
            components={{
              code({ inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={atomOneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        );

      case "api_details":
        return (
          <div className="w-full max-w-full">
            <Badge variant="outline" className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4" />
              API Response
            </Badge>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">
                  API Request Details
                </h4>
                <SyntaxHighlighter
                  style={atomOneDark}
                  language="json"
                  PreTag="div"
                  className="rounded-md text-sm max-h-fit overflow-y-auto"
                  wrapLines={true}
                >
                  {JSON.stringify(message.content, null, 2)}
                </SyntaxHighlighter>
              </div>

              {message.api_response && (
                <div>
                  <h4 className="text-sm font-medium mb-1">
                    API Response Data
                  </h4>
                  <SyntaxHighlighter
                    style={atomOneDark}
                    language="json"
                    PreTag="div"
                    className="rounded-md text-sm max-h-96 overflow-y-auto"
                    wrapLines={true}
                  >
                    {JSON.stringify(message.api_response, null, 2)}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>{message.content}</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
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
                  className={`max-w-full ${
                    message.type === "api_details"
                      ? "w-full"
                      : "max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl"
                  } rounded-lg overflow-hidden ${
                    message.sender === "human"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <div className="p-3">{renderMessageContent(message)}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-black rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
