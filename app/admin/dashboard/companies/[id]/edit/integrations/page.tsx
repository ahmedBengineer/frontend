"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, ExternalLink, Plus, Trash2 } from "lucide-react"

export default function EditCompanyIntegrations() {
  const params = useParams()
  const companyId = params.id

  const [integrations, setIntegrations] = useState([
    {
      id: 1,
      name: "Slack",
      type: "Communication",
      status: "Connected",
      description: "Team communication and notifications",
      lastSync: "2024-07-14 10:30",
      enabled: true,
    },
    {
      id: 2,
      name: "Salesforce",
      type: "CRM",
      status: "Not Connected",
      description: "Customer relationship management",
      lastSync: null,
      enabled: false,
    },
    {
      id: 3,
      name: "Zendesk",
      type: "Support",
      status: "Connected",
      description: "Customer support ticketing system",
      lastSync: "2024-07-14 09:15",
      enabled: true,
    },
    {
      id: 4,
      name: "Google Analytics",
      type: "Analytics",
      status: "Connected",
      description: "Website analytics and tracking",
      lastSync: "2024-07-14 11:00",
      enabled: true,
    },
    {
      id: 5,
      name: "Stripe",
      type: "Payment",
      status: "Not Connected",
      description: "Payment processing and billing",
      lastSync: null,
      enabled: false,
    },
  ])

  const handleToggleIntegration = (integrationId: number) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === integrationId ? { ...integration, enabled: !integration.enabled } : integration,
      ),
    )
  }

  const handleConnect = (integrationId: number) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              status: "Connected",
              lastSync: new Date().toISOString().slice(0, 16).replace("T", " "),
              enabled: true,
            }
          : integration,
      ),
    )
  }

  const handleDisconnect = (integrationId: number) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === integrationId
          ? {
              ...integration,
              status: "Not Connected",
              lastSync: null,
              enabled: false,
            }
          : integration,
      ),
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected":
        return "default"
      case "Not Connected":
        return "secondary"
      case "Error":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-slate-800">Integrations</h2>
          <p className="text-slate-500 text-sm mt-1">Manage external service integrations</p>
        </div>
        <Button className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Integration Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">4</div>
            <div className="text-sm text-slate-600">Connected</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-400">2</div>
            <div className="text-sm text-slate-600">Available</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">3</div>
            <div className="text-sm text-slate-600">Active</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">0</div>
            <div className="text-sm text-slate-600">Errors</div>
          </div>
        </div>
      </div>

      {/* Integrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Available Integrations</h3>
          <p className="text-xs text-slate-500 mt-0.5">Connect and manage external services</p>
        </div>
        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrations.map((integration) => (
                <TableRow key={integration.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{integration.name}</div>
                      <div className="text-sm text-slate-500">{integration.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{integration.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(integration.status)}>{integration.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {integration.lastSync ? (
                      <span className="text-sm">{integration.lastSync}</span>
                    ) : (
                      <span className="text-sm text-slate-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => handleToggleIntegration(integration.id)}
                      disabled={integration.status === "Not Connected"}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {integration.status === "Connected" ? (
                        <>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(integration.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleConnect(integration.id)}>
                          Connect
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Integration Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">API Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure API keys and endpoints</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" type="password" placeholder="Enter your API key" value="sk-..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://your-domain.com/webhook"
                value="https://smartconvo.com/webhook/company-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-limit">Rate Limit (requests/minute)</Label>
              <Input id="rate-limit" type="number" placeholder="100" value="100" />
            </div>
            <Button>Save Configuration</Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Sync Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configure data synchronization preferences</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Sync</Label>
                <p className="text-sm text-slate-600">Automatically sync data every hour</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Real-time Updates</Label>
                <p className="text-sm text-slate-600">Receive real-time notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Data Backup</Label>
                <p className="text-sm text-slate-600">Backup integration data daily</p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>Sync Frequency</Label>
              <select className="w-full p-2 border rounded-xl">
                <option>Every 15 minutes</option>
                <option>Every 30 minutes</option>
                <option selected>Every hour</option>
                <option>Every 6 hours</option>
                <option>Daily</option>
              </select>
            </div>
            <Button>Update Settings</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
