"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

export default function EditCompanyAgentSettings() {
  const params = useParams()
  const companyId = params.id

  const [voiceprintSettings, setVoiceprintSettings] = useState({
    enabled: true,
    sensitivity: [75],
    language: "English",
    accent: "American",
    speed: [1.0],
    pitch: [1.0],
  })

  const [voicePrompts, setVoicePrompts] = useState({
    greeting: "Hello! How can I assist you today?",
    fallback: "I'm sorry, I didn't understand that. Could you please rephrase?",
    goodbye: "Thank you for contacting us. Have a great day!",
    hold: "Please hold while I process your request.",
    transfer: "I'm transferring you to a specialist who can better assist you.",
  })

  const [agentPrompts, setAgentPrompts] = useState({
    systemPrompt: "You are a helpful customer service agent. Be polite, professional, and concise in your responses.",
    personality: "Professional and friendly",
    responseStyle: "Conversational",
    maxTokens: [150],
    temperature: [0.7],
  })

  const handleSaveSettings = () => {
    console.log("Saving agent settings:", {
      voiceprintSettings,
      voicePrompts,
      agentPrompts,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-slate-800">Agent Settings</h2>
          <p className="text-slate-600 mt-1">Configure AI agent behavior and voice settings</p>
        </div>
        <Button onClick={handleSaveSettings}>Save All Settings</Button>
      </div>

      <Tabs defaultValue="voiceprint" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voiceprint">Voiceprint</TabsTrigger>
          <TabsTrigger value="voice-prompts">Voice Prompts</TabsTrigger>
          <TabsTrigger value="agent-prompts">Agent Prompts</TabsTrigger>
        </TabsList>

        <TabsContent value="voiceprint" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voiceprint Configuration</CardTitle>
              <CardDescription>Configure voice recognition and synthesis settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="voiceprint-enabled">Enable Voiceprint</Label>
                  <p className="text-sm text-slate-600">Allow voice-based interactions</p>
                </div>
                <Switch
                  id="voiceprint-enabled"
                  checked={voiceprintSettings.enabled}
                  onCheckedChange={(checked) => setVoiceprintSettings((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>

              {voiceprintSettings.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select
                        value={voiceprintSettings.language}
                        onValueChange={(value) => setVoiceprintSettings((prev) => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Accent</Label>
                      <Select
                        value={voiceprintSettings.accent}
                        onValueChange={(value) => setVoiceprintSettings((prev) => ({ ...prev, accent: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="American">American</SelectItem>
                          <SelectItem value="British">British</SelectItem>
                          <SelectItem value="Australian">Australian</SelectItem>
                          <SelectItem value="Canadian">Canadian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Voice Sensitivity: {voiceprintSettings.sensitivity[0]}%</Label>
                      <Slider
                        value={voiceprintSettings.sensitivity}
                        onValueChange={(value) => setVoiceprintSettings((prev) => ({ ...prev, sensitivity: value }))}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Speech Speed: {voiceprintSettings.speed[0]}x</Label>
                      <Slider
                        value={voiceprintSettings.speed}
                        onValueChange={(value) => setVoiceprintSettings((prev) => ({ ...prev, speed: value }))}
                        max={2}
                        min={0.5}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Voice Pitch: {voiceprintSettings.pitch[0]}x</Label>
                      <Slider
                        value={voiceprintSettings.pitch}
                        onValueChange={(value) => setVoiceprintSettings((prev) => ({ ...prev, pitch: value }))}
                        max={2}
                        min={0.5}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice-prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Prompts</CardTitle>
              <CardDescription>Configure voice responses for different scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea
                  id="greeting"
                  value={voicePrompts.greeting}
                  onChange={(e) => setVoicePrompts((prev) => ({ ...prev, greeting: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallback">Fallback Message</Label>
                <Textarea
                  id="fallback"
                  value={voicePrompts.fallback}
                  onChange={(e) => setVoicePrompts((prev) => ({ ...prev, fallback: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goodbye">Goodbye Message</Label>
                <Textarea
                  id="goodbye"
                  value={voicePrompts.goodbye}
                  onChange={(e) => setVoicePrompts((prev) => ({ ...prev, goodbye: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hold">Hold Message</Label>
                <Textarea
                  id="hold"
                  value={voicePrompts.hold}
                  onChange={(e) => setVoicePrompts((prev) => ({ ...prev, hold: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer">Transfer Message</Label>
                <Textarea
                  id="transfer"
                  value={voicePrompts.transfer}
                  onChange={(e) => setVoicePrompts((prev) => ({ ...prev, transfer: e.target.value }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent-prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Prompts</CardTitle>
              <CardDescription>Configure AI agent behavior and response settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={agentPrompts.systemPrompt}
                  onChange={(e) => setAgentPrompts((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Personality</Label>
                  <Select
                    value={agentPrompts.personality}
                    onValueChange={(value) => setAgentPrompts((prev) => ({ ...prev, personality: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional and friendly">Professional and friendly</SelectItem>
                      <SelectItem value="Casual and approachable">Casual and approachable</SelectItem>
                      <SelectItem value="Formal and authoritative">Formal and authoritative</SelectItem>
                      <SelectItem value="Empathetic and supportive">Empathetic and supportive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Response Style</Label>
                  <Select
                    value={agentPrompts.responseStyle}
                    onValueChange={(value) => setAgentPrompts((prev) => ({ ...prev, responseStyle: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conversational">Conversational</SelectItem>
                      <SelectItem value="Concise">Concise</SelectItem>
                      <SelectItem value="Detailed">Detailed</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Response Length: {agentPrompts.maxTokens[0]} tokens</Label>
                  <Slider
                    value={agentPrompts.maxTokens}
                    onValueChange={(value) => setAgentPrompts((prev) => ({ ...prev, maxTokens: value }))}
                    max={500}
                    min={50}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Creativity Level: {agentPrompts.temperature[0]}</Label>
                  <Slider
                    value={agentPrompts.temperature}
                    onValueChange={(value) => setAgentPrompts((prev) => ({ ...prev, temperature: value }))}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500">
                    Lower values make responses more focused, higher values more creative
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
