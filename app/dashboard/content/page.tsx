"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Globe, LinkIcon, FileText, Plus, Trash2 } from "lucide-react"

interface ContentItem {
  id: string
  name: string
  type: "website" | "url" | "file"
  status: "active" | "inactive"
  dateAdded: string
}

export default function ContentPage() {
  const [useAsTemplate, setUseAsTemplate] = useState(true)
  const [enableAutoRefresh, setEnableAutoRefresh] = useState(true)
  const [templateName, setTemplateName] = useState("")
  const [llmInstructions, setLlmInstructions] = useState("")
  const [refreshInterval, setRefreshInterval] = useState("30")
  const [refreshUnit, setRefreshUnit] = useState("Days")
  const [contentItems, setContentItems] = useState<ContentItem[]>([])

  // Dialog states
  const [websiteDialog, setWebsiteDialog] = useState(false)
  const [urlDialog, setUrlDialog] = useState(false)
  const [fileDialog, setFileDialog] = useState(false)

  // Form states
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [singleUrl, setSingleUrl] = useState("https://app.revmo.ai")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleAddWebsite = () => {
    if (websiteUrl.trim()) {
      const newItem: ContentItem = {
        id: Date.now().toString(),
        name: websiteUrl,
        type: "website",
        status: "active",
        dateAdded: new Date().toISOString(),
      }
      setContentItems((prev) => [...prev, newItem])
      setWebsiteUrl("")
      setWebsiteDialog(false)
    }
  }

  const handleAddUrl = () => {
    if (singleUrl.trim()) {
      const newItem: ContentItem = {
        id: Date.now().toString(),
        name: singleUrl,
        type: "url",
        status: "active",
        dateAdded: new Date().toISOString(),
      }
      setContentItems((prev) => [...prev, newItem])
      setSingleUrl("https://app.revmo.ai")
      setUrlDialog(false)
    }
  }

  const handleAddFile = () => {
    if (selectedFile) {
      const newItem: ContentItem = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: "file",
        status: "active",
        dateAdded: new Date().toISOString(),
      }
      setContentItems((prev) => [...prev, newItem])
      setSelectedFile(null)
      setFileDialog(false)
    }
  }

  const handleRemoveItem = (id: string) => {
    setContentItems((prev) => prev.filter((item) => item.id !== id))
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "website":
        return <Globe className="w-4 h-4" />
      case "url":
        return <LinkIcon className="w-4 h-4" />
      case "file":
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Content for 12</h1>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            PUBLISH CONTENT (V1)
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            PUBLISH CONTENT (V2)
          </Button>
        </div>
      </div>

      {/* Template Settings */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Use as Template Toggle */}
          <div className="flex items-center space-x-3">
            <Switch
              checked={useAsTemplate}
              onCheckedChange={setUseAsTemplate}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label className="text-base font-medium">Use as Template</Label>
          </div>

          {/* Template Fields */}
          {useAsTemplate && (
            <div className="space-y-4 pl-8">
              <div>
                <Label htmlFor="templateName" className="text-sm font-medium text-gray-700">
                  Template Name
                </Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="llmInstructions" className="text-sm font-medium text-gray-700">
                  LLM Processing Instructions
                </Label>
                <Textarea
                  id="llmInstructions"
                  value={llmInstructions}
                  onChange={(e) => setLlmInstructions(e.target.value)}
                  placeholder="Enter processing instructions for the LLM"
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Auto Refresh Toggle */}
          <div className="flex items-center space-x-3">
            <Switch
              checked={enableAutoRefresh}
              onCheckedChange={setEnableAutoRefresh}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label className="text-base font-medium">Enable Auto Refresh</Label>
          </div>

          {/* Auto Refresh Settings */}
          {enableAutoRefresh && (
            <div className="flex items-center space-x-3 pl-8">
              <Label className="text-sm font-medium text-gray-700">Refresh Every</Label>
              <Input
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="w-20"
                min="1"
              />
              <Select value={refreshUnit} onValueChange={setRefreshUnit}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Minutes">Minutes</SelectItem>
                  <SelectItem value="Hours">Hours</SelectItem>
                  <SelectItem value="Days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          BACK
        </Button>

        <Dialog open={websiteDialog} onOpenChange={setWebsiteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Globe className="w-4 h-4 mr-2" />
              ADD WEB SITE
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Website</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setWebsiteDialog(false)}>
                  CANCEL
                </Button>
                <Button onClick={handleAddWebsite} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  ADD
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={urlDialog} onOpenChange={setUrlDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <LinkIcon className="w-4 h-4 mr-2" />
              ADD SINGLE URL
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Single URL</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="singleUrl">URL</Label>
                <Input id="singleUrl" value={singleUrl} onChange={(e) => setSingleUrl(e.target.value)} />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setUrlDialog(false)}>
                  CANCEL
                </Button>
                <Button onClick={handleAddUrl} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  ADD
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={fileDialog} onOpenChange={setFileDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              ADD FILE
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <span className="inline-flex items-center">
                  ℹ️ Valid file types: plain text-based files (.txt, .csv, .html, .xml, etc.) as well as PDFs
                </span>
              </div>
              <div>
                <Label htmlFor="fileInput">Choose File</Label>
                <Input
                  id="fileInput"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".txt,.csv,.html,.xml,.pdf"
                  className="mt-1"
                />
                {!selectedFile && <p className="text-sm text-gray-500 mt-1">No file chosen</p>}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setFileDialog(false)}>
                  CANCEL
                </Button>
                <Button onClick={handleAddFile} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  ADD
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content Table */}
      {contentItems.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contentItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getItemIcon(item.type)}
                          <span className="ml-2 text-sm text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-center">
        <Button className="bg-blue-600 hover:bg-blue-700 px-8">💾 SAVE SETTINGS</Button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <p>© {new Date().getFullYear()} All rights reserved.</p>
        <p>Browser Session ID: f4f2fc7d-7161-4d53-ae5f-6bd14515f55b 📋</p>
      </div>
    </div>
  )
}
