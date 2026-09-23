"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TaskSettingsPage() {
  const router = useRouter()
  const [taskDescriptionExpanded, setTaskDescriptionExpanded] = useState(true)
  const [executionSettingsExpanded, setExecutionSettingsExpanded] = useState(true)
  const [interactionModes, setInteractionModes] = useState(["chat", "email", "text", "voice"])
  const [model, setModel] = useState("gpt-4")
  const [prompt, setPrompt] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [additionalHeaders, setAdditionalHeaders] = useState("")
  const [qualifiedMessage, setQualifiedMessage] = useState("")
  const [disqualifiedMessage, setDisqualifiedMessage] = useState("")
  const [triggerKeywords, setTriggerKeywords] = useState("")

  const removeInteractionMode = (mode: string) => {
    setInteractionModes(interactionModes.filter((m) => m !== mode))
  }

  const handleSave = () => {
    // Save logic here
    console.log("Saving task settings...")
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Configure Conversation to Webhook</h1>
      </div>

      {/* Task Description */}
      <div className="bg-white rounded-lg border">
        <button
          onClick={() => setTaskDescriptionExpanded(!taskDescriptionExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between text-left border-b border-gray-200"
        >
          <h2 className="text-lg font-medium text-blue-600">Task Description</h2>
          {taskDescriptionExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {taskDescriptionExpanded && (
          <div className="px-6 py-4">
            <p className="text-gray-600">
              Create a prompt to collect information on your caller. When the caller has successfully completed
              everything, then send it to the configured webhook.
            </p>
          </div>
        )}
      </div>

      {/* Default Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Default Settings</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interaction Modes</label>
          <div className="flex flex-wrap gap-2">
            {interactionModes.map((mode) => (
              <Badge key={mode} variant="secondary" className="flex items-center space-x-1">
                <span>{mode}</span>
                <button onClick={() => removeInteractionMode(mode)} className="ml-1 hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model - Which AI model should drive this task? Usually GPT-4 or GPT-4o.
          </label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">gpt-4</SelectItem>
              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
              <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Execution Settings */}
      <div className="bg-white rounded-lg border">
        <button
          onClick={() => setExecutionSettingsExpanded(!executionSettingsExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between text-left border-b border-gray-200"
        >
          <h2 className="text-lg font-medium text-gray-900">Execution Settings</h2>
          {executionSettingsExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {executionSettingsExpanded && (
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Task:</strong> A list of keywords or phrases can be used to automatically trigger the task.
                These will be compared against the responses of the user and if a match is found, the task will be
                executed immediately.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Prompt Tool:</strong> The second option is to provide the task as a 'tool' to the AI Agent. This
                allows the agent to use its own discretion on when to use the task. The tool description will
                communicate to the Agent what the tool does (and what it may return), when it should be used, and what
                each parameter (if any) means and how it affects the behavior of the tool. The description should also
                include any caveats or limitations.
              </p>
            </div>

            <Button className="bg-teal-600 hover:bg-teal-700">Switch to Prompt Tool</Button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger - Keywords and phrases that will trigger this task.
              </label>
              <Textarea
                value={triggerKeywords}
                onChange={(e) => setTriggerKeywords(e.target.value)}
                className="w-full"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task Specific Settings */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Task Specific Settings</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Prompt</label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full" rows={6} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Where Qualified Responses Go</label>
          <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional headers to send with the webhook. Format: [NAME]: [VALUE]
          </label>
          <Textarea
            value={additionalHeaders}
            onChange={(e) => setAdditionalHeaders(e.target.value)}
            className="w-full"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Say to the caller after a qualified completion
          </label>
          <Textarea
            value={qualifiedMessage}
            onChange={(e) => setQualifiedMessage(e.target.value)}
            className="w-full"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Say to the caller if they are disqualified
          </label>
          <Textarea
            value={disqualifiedMessage}
            onChange={(e) => setDisqualifiedMessage(e.target.value)}
            className="w-full"
            rows={3}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          SAVE
        </Button>
        <Button onClick={handleCancel} variant="outline">
          CANCEL
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 space-y-1 pt-8">
        <p>© {new Date().getFullYear()} All rights reserved.</p>
        <p>Browser Session ID: f4f2fc7d-7161-4d53-ae5f-6bd14515f55b 📋</p>
      </div>
    </div>
  )
}
