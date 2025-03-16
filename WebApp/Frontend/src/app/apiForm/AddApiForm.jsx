import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AddApiForm() {
  const [formData, setFormData] = useState({
    apiName: "",
    apiEndpoint: "",
    apiKey: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add API submission logic here
    console.log("API form submitted:", formData);

    // Reset form after submission
    setFormData({
      apiName: "",
      apiEndpoint: "",
      apiKey: "",
      description: "",
    });
  };

  return (
    <Card className="rounded-none h-full">
      <CardHeader>
        <CardTitle>Add New API</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiName">API Name</Label>
            <Input
              id="apiName"
              name="apiName"
              value={formData.apiName}
              onChange={handleChange}
              placeholder="Enter API name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiEndpoint">API Endpoint</Label>
            <Input
              id="apiEndpoint"
              name="apiEndpoint"
              value={formData.apiEndpoint}
              onChange={handleChange}
              placeholder="https://example.com/api"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={handleChange}
              placeholder="Enter your API key"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description for this API"
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full">
            Add API
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
