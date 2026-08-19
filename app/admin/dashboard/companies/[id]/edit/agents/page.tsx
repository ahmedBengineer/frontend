"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, Settings } from "lucide-react"

export default function EditCompanyAgents() {
  const params = useParams()
  const companyId = params.id

  const [agents, setAgents] = useState([
    {
      id: 1,
      name: "Customer Support Agent",
      type: "Support",
      status: "Active",
      description: "Handles customer inquiries and support tickets",
      language: "English",
      voiceEnabled: true,
      lastUpdated: "2024-07-10",
    },
    {
      id: 2,
      name: "Sales Assistant",
      type: "Sales",
      status: "Active",
      description: "Assists with product inquiries and sales processes",
      language: "English",
      voiceEnabled: false,
      lastUpdated: "2024-07-08",
    },
    {
      id: 3,
      name: "Technical Support",
      type: "Technical",
      status: "Inactive",
      description: "Provides technical assistance and troubleshooting",
      language: "English",
      voiceEnabled: true,
      lastUpdated: "2024-07-05",
    },
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [newAgent, setNewAgent] = useState({
    name: "",
    type: "Support",
    description: "",
    language: "English",
    voiceEnabled: false,
  })

  const handleAddAgent = () => {
    const agent = {
      id: agents.length + 1,
      ...newAgent,
      status: "Active",
      lastUpdated: new Date().toISOString().split("T")[0],
    }
    setAgents([...agents, agent])
    setNewAgent({
      name: "",
      type: "Support",
      description: "",
      language: "English",
      voiceEnabled: false,
    })
    setShowAddForm(false)
  }

  const handleDeleteAgent = (agentId: number) => {
    setAgents(agents.filter((agent) => agent.id !== agentId))
  }

  const handleToggleStatus = (agentId: number) => {
    setAgents(
      agents.map((agent) =>
        agent.id === agentId ? { ...agent, status: agent.status === "Active" ? "Inactive" : "Active" } : agent,
      ),
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-slate-800">Agent Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage AI agents for this company</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25">
          <Plus className="h-4 w-4" />
          <span>Add New Agent</span>
        </Button>
      </div>

      {/* Add Agent Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Add New Agent</h3>
            <p className="text-xs text-slate-500 mt-0.5">Create a new AI agent for this company</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter agent name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-type">Agent Type</Label>
                <Select
                  value={newAgent.type}
                  onValueChange={(value) => setNewAgent((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-language">Language</Label>
                <Select
                  value={newAgent.language}
                  onValueChange={(value) => setNewAgent((prev) => ({ ...prev, language: value }))}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voice-enabled">Voice Enabled</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="voice-enabled"
                    checked={newAgent.voiceEnabled}
                    onCheckedChange={(checked) => setNewAgent((prev) => ({ ...prev, voiceEnabled: checked }))}
                  />
                  <span className="text-sm text-slate-600">{newAgent.voiceEnabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-description">Description</Label>
              <Textarea
                id="agent-description"
                value={newAgent.description}
                onChange={(e) => setNewAgent((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the agent's purpose and capabilities"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddAgent} className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700">Add Agent</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Agents List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{agent.name}</h3>
                  <p className="text-sm text-slate-500">{agent.type} Agent</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${agent.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{agent.status}</span>
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="text-red-600 hover:text-red-700 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">{agent.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Language:</span>
                  <p className="text-slate-600">{agent.language}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Voice:</span>
                  <p className="text-slate-600">{agent.voiceEnabled ? "Enabled" : "Disabled"}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Last Updated:</span>
                  <p className="text-slate-600">{new Date(agent.lastUpdated).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Status:</span>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={agent.status === "Active"}
                      onCheckedChange={() => handleToggleStatus(agent.id)}
                      size="sm"
                    />
                    <span className="text-slate-600">{agent.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 text-center py-12">
          <p className="text-slate-500">No agents found. Create your first agent to get started.</p>
        </div>
      )}
    </div>
  )
}
