import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
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

function ParameterInput({ parameter, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Input
        value={parameter.name}
        onChange={(e) => onChange({ ...parameter, name: e.target.value })}
        placeholder="Parameter name"
        className="h-9"
      />
      <Select
        value={parameter.type}
        onValueChange={(value) => onChange({ ...parameter, type: value })}
      >
        <SelectTrigger className="h-9 w-[120px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="string">Text</SelectItem>
          <SelectItem value="number">Number</SelectItem>
          <SelectItem value="boolean">Yes/No</SelectItem>
          <SelectItem value="date">Date</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={parameter.requirement}
        onValueChange={(value) =>
          onChange({ ...parameter, requirement: value })
        }
      >
        <SelectTrigger className="h-9 w-[120px]">
          <SelectValue placeholder="Required?" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="required">Required</SelectItem>
          <SelectItem value="optional">Optional</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-9 w-9"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function HeaderInput({ header, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Input
        value={header.key}
        onChange={(e) => onChange({ ...header, key: e.target.value })}
        placeholder="Header name"
        className="h-7 text-sm"
      />
      <Input
        value={header.value}
        onChange={(e) => onChange({ ...header, value: e.target.value })}
        placeholder="Value"
        className="h-7 text-sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-7 w-7"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

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
      parameters: [],
      headers: [], // Changed from string to array of objects
      isRequired: false,
    },
  ]);

  const [headers, setHeaders] = useState([
    {
      id: 1,
      key: "Content-Type",
      value: "application/json",
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

  const handleParameterChange = (endpointId, parameterId, updatedParameter) => {
    setEndpoints((prev) =>
      prev.map((endpoint) => {
        if (endpoint.id === endpointId) {
          return {
            ...endpoint,
            parameters: endpoint.parameters.map((param) =>
              param.id === parameterId ? updatedParameter : param
            ),
          };
        }
        return endpoint;
      })
    );
  };

  const addParameter = (endpointId) => {
    setEndpoints((prev) =>
      prev.map((endpoint) => {
        if (endpoint.id === endpointId) {
          return {
            ...endpoint,
            parameters: [
              ...endpoint.parameters,
              {
                id: Date.now(),
                name: "",
                type: "string",
                requirement: "required",
              },
            ],
          };
        }
        return endpoint;
      })
    );
  };

  const deleteParameter = (endpointId, parameterId) => {
    setEndpoints((prev) =>
      prev.map((endpoint) => {
        if (endpoint.id === endpointId) {
          return {
            ...endpoint,
            parameters: endpoint.parameters.filter(
              (param) => param.id !== parameterId
            ),
          };
        }
        return endpoint;
      })
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
        parameters: [], // Initialize with empty parameters array
        headers: [], // Initialize with empty headers array
        isRequired: false,
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
        parameters: [],
        headers: [],
        isRequired: false,
      },
    ]);
  };

  const addHeader = () => {
    const newId =
      headers.length > 0 ? Math.max(...headers.map((h) => h.id)) + 1 : 1;
    setHeaders([...headers, { id: newId, key: "", value: "" }]);
  };

  const updateHeader = (headerId, updatedHeader) => {
    setHeaders((prev) =>
      prev.map((header) => (header.id === headerId ? updatedHeader : header))
    );
  };

  const deleteHeader = (headerId) => {
    setHeaders((prev) => prev.filter((header) => header.id !== headerId));
  };

  const handleEndpointHeaderChange = (endpointId, headerId, updatedHeader) => {
    setEndpoints((prev) =>
      prev.map((endpoint) => {
        if (endpoint.id === endpointId) {
          return {
            ...endpoint,
            headers: endpoint.headers.map((header) =>
              header.id === headerId ? updatedHeader : header
            ),
          };
        }
        return endpoint;
      })
    );
  };

  const addEndpointHeader = (endpointId) => {
    setEndpoints((prev) =>
      prev.map((endpoint) => {
        if (endpoint.id === endpointId) {
          const newId =
            endpoint.headers.length > 0
              ? Math.max(...endpoint.headers.map((h) => h.id)) + 1
              : 1;
          return {
            ...endpoint,
            headers: [...endpoint.headers, { id: newId, key: "", value: "" }],
          };
        }
        return endpoint;
      })
    );
  };

  const deleteEndpointHeader = (endpointId, headerId) => {
    setEndpoints((prev) =>
      prev.map((endpoint) => {
        if (endpoint.id === endpointId) {
          return {
            ...endpoint,
            headers: endpoint.headers.filter(
              (header) => header.id !== headerId
            ),
          };
        }
        return endpoint;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true); // Disable the submit button

    try {
      const processedEndpoints = endpoints.map((endpoint) => {
        // Convert headers array to object format
        const headersObject = endpoint.headers.reduce((acc, header) => {
          if (header.key && header.value) {
            acc[header.key] = header.value;
          }
          return acc;
        }, {});

        return {
          ...endpoint,
          headers: headersObject,
        };
      });

      const apiDataWithHeaders = {
        ...apiData,
        headers: processedEndpoints.reduce((acc, endpoint) => {
          acc[endpoint.path] = endpoint.headers;
          return acc;
        }, {}),
      };

      const response = await fetch(
        "https://tenant-aware-chatbot-1.onrender.com/api/add",
        //"http://localhost:5000/api/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiData: apiDataWithHeaders,
            endpoints: processedEndpoints,
          }),
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
              <div className="space-y-2 border rounded-md p-3">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm text-muted-foreground flex-1">
                    Common headers:
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newId =
                        headers.length > 0
                          ? Math.max(...headers.map((h) => h.id)) + 1
                          : 1;
                      setHeaders([
                        ...headers,
                        {
                          id: newId,
                          key: "Authorization",
                          value: "Bearer ",
                        },
                      ]);
                    }}
                  >
                    + Auth Header
                  </Button>
                </div>

                {headers.map((header) => (
                  <HeaderInput
                    key={header.id}
                    header={header}
                    onChange={(updatedHeader) =>
                      updateHeader(header.id, updatedHeader)
                    }
                    onDelete={() => deleteHeader(header.id)}
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addHeader}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Header
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Common headers include Authorization for authentication and
                Content-Type for specifying data format.
              </p>
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
                      <TableCell>
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
                        <div className="space-y-2">
                          {endpoint.parameters.map((param) => (
                            <ParameterInput
                              key={param.id}
                              parameter={param}
                              onChange={(updatedParam) =>
                                handleParameterChange(
                                  endpoint.id,
                                  param.id,
                                  updatedParam
                                )
                              }
                              onDelete={() =>
                                deleteParameter(endpoint.id, param.id)
                              }
                            />
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addParameter(endpoint.id)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Parameter
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setEndpoints((prev) =>
                                  prev.map((ep) => {
                                    if (ep.id === endpoint.id) {
                                      return {
                                        ...ep,
                                        headers: [
                                          ...ep.headers,
                                          {
                                            id: Date.now(),
                                            key: "Content-Type",
                                            value: "application/json",
                                          },
                                        ],
                                      };
                                    }
                                    return ep;
                                  })
                                );
                              }}
                            >
                              + Content-Type
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setEndpoints((prev) =>
                                  prev.map((ep) => {
                                    if (ep.id === endpoint.id) {
                                      return {
                                        ...ep,
                                        headers: [
                                          ...ep.headers,
                                          {
                                            id: Date.now(),
                                            key: "Authorization",
                                            value: "Bearer ",
                                          },
                                        ],
                                      };
                                    }
                                    return ep;
                                  })
                                );
                              }}
                            >
                              + Auth
                            </Button>
                          </div>
                          {endpoint.headers.map((header) => (
                            <HeaderInput
                              key={header.id}
                              header={header}
                              onChange={(updatedHeader) =>
                                handleEndpointHeaderChange(
                                  endpoint.id,
                                  header.id,
                                  updatedHeader
                                )
                              }
                              onDelete={() =>
                                deleteEndpointHeader(endpoint.id, header.id)
                              }
                            />
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addEndpointHeader(endpoint.id)}
                            className="w-full h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Header
                          </Button>
                        </div>
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
