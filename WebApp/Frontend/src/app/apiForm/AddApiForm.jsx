import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AddApiForm() {
  const [apiData, setApiData] = useState({
    companyName: "",
    baseUrl: "",
    purpose: "",
    apiKey: "",
    headers: JSON.stringify(), // Initialize headers as an empty JSON object
    authType: "", // New field for authentication type
  });

  const [endpoints, setEndpoints] = useState([
    {
      id: 1,
      path: "",
      method: "GET",
      purpose: "",
      params: JSON.stringify(), // Initialize params as an empty JSON object
      headers: JSON.stringify(), // Initialize headers as an empty JSON object
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false); // To prevent multiple submissions

  const handleApiDataChange = (e) => {
    const { name, value } = e.target;
    setApiData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEndpointChange = (id, field, value) => {
    setEndpoints((prev) =>
      prev.map((endpoint) =>
        endpoint.id === id ? { ...endpoint, [field]: value } : endpoint
      )
    );
  };

  const addEndpoint = () => {
    const newId =
      endpoints.length > 0 ? Math.max(...endpoints.map((e) => e.id)) + 1 : 1;
    setEndpoints([
      ...endpoints,
      {
        id: newId,
        path: "",
        method: "GET",
        purpose: "",
        params: JSON.stringify({}),
        headers: JSON.stringify({}),
      },
    ]);
  };

  const clearForm = () => {
    setApiData({
      companyName: "",
      baseUrl: "",
      purpose: "",
      apiKey: "",
      headers: JSON.stringify({}),
      authType: "",
    });
    setEndpoints([
      {
        id: 1,
        path: "",
        method: "GET",
        purpose: "",
        params: JSON.stringify({}),
        headers: JSON.stringify({}),
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true); // Disable the submit button

    try {
      const response = await fetch(
        "https://tenant-aware-chatbot-1.onrender.com/api/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiData, endpoints }),
        }
      );

      if (response.ok) {
        alert("API added successfully");
        clearForm(); // Clear the form after successful submission
      } else {
        alert("Failed to add API");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting form");
    } finally {
      setIsSubmitting(false); // Re-enable the submit button
    }
  };

  return (
    <Card className="rounded-none h-full">
      <CardHeader>
        <CardTitle>Add New API Integration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main API Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                value={apiData.companyName}
                onChange={handleApiDataChange}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                value={apiData.apiKey}
                onChange={handleApiDataChange}
                placeholder="Enter your API key"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                value={apiData.baseUrl}
                onChange={handleApiDataChange}
                placeholder="https://api.example.com"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="purpose">Purpose of API</Label>
              <Textarea
                id="purpose"
                name="purpose"
                value={apiData.purpose}
                onChange={handleApiDataChange}
                placeholder="Describe the overall purpose of this API"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headers">Headers</Label>
              <Textarea
                id="headers"
                name="headers"
                value={apiData.headers}
                onChange={handleApiDataChange}
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authType">Authentication Type</Label>
              <Select
                value={apiData.authType}
                onValueChange={(value) =>
                  setApiData((prev) => ({ ...prev, authType: value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API Key">API Key</SelectItem>
                  <SelectItem value="OAuth">OAuth</SelectItem>
                  <SelectItem value="Bearer Token">Bearer Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Endpoints Table */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Endpoints</h3>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint Path</TableHead>
                    <TableHead className=" flex justify-center items-center">
                      Method
                    </TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Parameters/Schema</TableHead>
                    <TableHead>Headers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((endpoint) => (
                    <TableRow key={endpoint.id}>
                      <TableCell>
                        <Input
                          value={endpoint.path}
                          onChange={(e) =>
                            handleEndpointChange(
                              endpoint.id,
                              "path",
                              e.target.value
                            )
                          }
                          placeholder="/users"
                          className="h-9"
                          required
                        />
                      </TableCell>
                      <TableCell className="flex justify-center items-center">
                        <Select
                          value={endpoint.method}
                          onValueChange={(value) =>
                            handleEndpointChange(endpoint.id, "method", value)
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={endpoint.purpose}
                          onChange={(e) =>
                            handleEndpointChange(
                              endpoint.id,
                              "purpose",
                              e.target.value
                            )
                          }
                          placeholder="Purpose of endpoint"
                          className="h-9"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={endpoint.params}
                          onChange={(e) =>
                            handleEndpointChange(
                              endpoint.id,
                              "params",
                              e.target.value
                            )
                          }
                          placeholder='{"param1": "required", "param2": "optional"}'
                          className="min-h-0 h-9 py-2"
                          rows={2}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={endpoint.headers}
                          onChange={(e) =>
                            handleEndpointChange(
                              endpoint.id,
                              "headers",
                              e.target.value
                            )
                          }
                          placeholder='{"Content-Type": "application/json"}'
                          className="min-h-0 h-9 py-2"
                          rows={2}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Add Endpoint Button */}
              <div className="flex justify-center p-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEndpoint}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Endpoint
                </Button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isSubmitting} // Disable button while submitting
          >
            {isSubmitting ? "Submitting..." : "Save API Integration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
