import React, { useState } from "react";
import { Card, CardFooter, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Image as ImageIcon, Paperclip } from "lucide-react";

export function Chat() {
  const [inputValue, setInputValue] = useState("");

  // Local image paths - replace these with your actual local image paths
  const localImages = {
    mobileExample: "/src/assets/insat1.png",
    defaultAvatar: "/images/user-avatar.png",
    botAvatar: "/images/bot-avatar.png",
  };

  // Dummy chat messages with both text and image content
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      type: "text",
      content: "Hello! How can I help you today?",
    },
    {
      id: 2,
      sender: "human",
      type: "text",
      content: "What is insat-3dr",
    },
    {
      id: 3,
      sender: "bot",
      type: "text",
      content:
        " INSAT-3DR is a specialized weather satellite! It's designed to give us better weather observations and monitor land and ocean surfaces. Think of it as a super-powered weather watcher!",
    },
    {
      id: 5,
      sender: "human",
      type: "text",
      content: "What kind of equipment does it have?",
    },
    {
      id: 6,
      sender: "bot",
      type: "text",
      content:
        "It's packed with cool tech! It carries a Sounder and an Imager for detailed weather pictures, a Data Relay Transponder (DRT) to send information, and a Satellite Aided Search & Rescue (SAS&R) system to help in emergencies.",
    },
    {
      id: 7,
      sender: "human",
      type: "text",
      content: "can you give me example what does it do",
    },
    {
      id: 8,
      sender: "bot",
      type: "image",
      content: localImages.mobileExample,
      caption: "Here is a example of iamges taken with INSAT-3DR",
    },
  ]);

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setSelectedImagePreview(previewUrl);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newMessages = [];

    // Add user text message if there's input
    if (inputValue.trim()) {
      newMessages.push({
        id: messages.length + 1,
        sender: "human",
        type: "text",
        content: inputValue,
      });
    }

    // Add user image message if there's a selected image
    if (selectedImagePreview) {
      newMessages.push({
        id: messages.length + 1 + (inputValue.trim() ? 1 : 0),
        sender: "human",
        type: "image",
        content: selectedImagePreview,
        caption: selectedImage.name || "Uploaded image",
      });
    }

    if (newMessages.length > 0) {
      setMessages([...messages, ...newMessages]);

      // Clear inputs
      setInputValue("");
      setSelectedImage(null);
      setSelectedImagePreview("");
      setShowImageUpload(false);

      // Simulate bot response
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 1,
            sender: "bot",
            type: "text",
            content:
              "Thanks for sharing! Is there anything specific you want to discuss about these designs?",
          },
        ]);
      }, 1000);
    }
  };

  const cancelImageUpload = () => {
    setSelectedImage(null);
    setSelectedImagePreview("");
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
                {/* Avatar - uncomment if you want to display avatars */}
                {/* <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                  <img 
                    src={message.sender === "human" ? localImages.defaultAvatar : localImages.botAvatar} 
                    alt={`${message.sender} avatar`} 
                    className="w-full h-full object-cover" 
                  />
                </div> */}

                <div
                  className={`max-w-xs md:max-w-md rounded-lg overflow-hidden ${
                    message.sender === "human"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  {message.type === "text" ? (
                    <div className="p-3">{message.content}</div>
                  ) : (
                    <div className="flex flex-col">
                      <img
                        src={message.content}
                        alt={message.caption || "Chat image"}
                        className="w-full h-auto object-cover"
                        // onError={(e) => {
                        //   e.target.onerror = null;
                        //   e.target.src = "/images/fallback-image.jpg"; // Fallback image
                        //   console.error("Image failed to load, using fallback");
                        // }}
                      />
                      {message.caption && (
                        <div
                          className={`p-2 text-sm ${
                            message.sender === "human"
                              ? "text-blue-100"
                              : "text-gray-600"
                          }`}
                        >
                          {message.caption}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="self-end w-full sticky bottom-0 bg-white border-t flex-col p-3">
          {showImageUpload && (
            <div className="w-full mb-3">
              {selectedImagePreview ? (
                <div className="relative mb-2">
                  <img
                    src={selectedImagePreview}
                    alt="Preview"
                    className="h-32 object-contain rounded border border-gray-200"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-1 rounded-full"
                    onClick={cancelImageUpload}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg mb-2">
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      Click to upload image
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              type="text"
              placeholder="Ask AI"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={showImageUpload ? "bg-blue-100" : ""}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() && !selectedImagePreview}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  );
}
