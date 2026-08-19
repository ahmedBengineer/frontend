// "use client"

// import type * as React from "react"
// import { useState } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Check, UploadCloud } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { AudioPlayer } from "@/components/ui/audio-player"
// import { useToast } from "@/hooks/use-toast"

// interface AddAgentWizardProps {
//   isOpen: boolean
//   onClose: () => void
//   onAgentAdded: (agentData: any) => void
// }

// interface AgentFormData {
//   name: string
//   persona: string
//   goals: string
//   voiceType: "predefined" | "upload"
//   selectedVoiceId?: string
//   uploadedVoiceFile?: File | null
// }

// const predefinedVoices = [
//   {
//     id: "marissa",
//     name: "Marissa",
//     description: "your voice agent from Canada.",
//     avatar: "/placeholder.svg?height=64&width=64",
//     audioSrc: "/placeholder.svg?height=64&width=64", // Replace with actual audio URL
//   },
//   {
//     id: "scott",
//     name: "Scott",
//     description: "your voice agent from America.",
//     avatar: "/placeholder.svg?height=64&width=64",
//     audioSrc: "/placeholder.svg?height=64&width=64", // Replace with actual audio URL
//   },
//   {
//     id: "charlie",
//     name: "Charlie",
//     description: "your voice agent from UK.",
//     avatar: "/placeholder.svg?height=64&width=64",
//     audioSrc: "/placeholder.svg?height=64&width=64", // Replace with actual audio URL
//   },
// ]

// export function AddAgentWizard({ isOpen, onClose, onAgentAdded }: AddAgentWizardProps) {
//   const [step, setStep] = useState(1)
//   const [formData, setFormData] = useState<AgentFormData>({
//     name: "",
//     persona: "",
//     goals: "",
//     voiceType: "predefined",
//     selectedVoiceId: predefinedVoices[0].id,
//     uploadedVoiceFile: null,
//   })
//   const [isLoading, setIsLoading] = useState(false)
//   const { toast } = useToast()

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { id, value } = e.target
//     setFormData((prev) => ({ ...prev, [id]: value }))
//   }

//   const handleVoiceSelection = (voiceId: string) => {
//     setFormData((prev) => ({ ...prev, voiceType: "predefined", selectedVoiceId: voiceId, uploadedVoiceFile: null }))
//   }

//   const handleVoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       if (file.type !== "audio/mpeg") {
//         toast({
//           title: "Invalid file type",
//           description: "Please upload an MP3 file.",
//           variant: "destructive",
//         })
//         return
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         // 5MB limit for demo
//         toast({
//           title: "File too large",
//           description: "Maximum file size is 5MB.",
//           variant: "destructive",
//         })
//         return
//       }
//       setFormData((prev) => ({ ...prev, voiceType: "upload", uploadedVoiceFile: file, selectedVoiceId: undefined }))
//     }
//   }

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     e.stopPropagation()
//   }

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     e.stopPropagation()
//     const file = e.dataTransfer.files?.[0]
//     if (file) {
//       if (file.type !== "audio/mpeg") {
//         toast({
//           title: "Invalid file type",
//           description: "Please upload an MP3 file.",
//           variant: "destructive",
//         })
//         return
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         // 5MB limit for demo
//         toast({
//           title: "File too large",
//           description: "Maximum file size is 5MB.",
//           variant: "destructive",
//         })
//         return
//       }
//       setFormData((prev) => ({ ...prev, voiceType: "upload", uploadedVoiceFile: file, selectedVoiceId: undefined }))
//     }
//   }

//   const handleNext = () => {
//     if (step === 1 && !formData.name.trim()) {
//       toast({
//         title: "Agent Name Required",
//         description: "Please enter a name for your agent.",
//         variant: "destructive",
//       })
//       return
//     }
//     if (step === 2 && !formData.persona.trim()) {
//       toast({
//         title: "Agent Persona Required",
//         description: "Please describe the agent's persona.",
//         variant: "destructive",
//       })
//       return
//     }
//     if (step === 3 && !formData.goals.trim()) {
//       toast({
//         title: "Agent Goals Required",
//         description: "Please describe the agent's goals.",
//         variant: "destructive",
//       })
//       return
//     }
//     setStep((prev) => prev + 1)
//   }

//   const handleBack = () => {
//     setStep((prev) => prev - 1)
//   }

//   const handleSubmit = async () => {
//     setIsLoading(true)
//     // Simulate API call
//     await new Promise((resolve) => setTimeout(resolve, 2000))

//     // Here you would send formData to your backend
//     console.log("Submitting agent data:", formData)

//     onAgentAdded(formData) // Pass data to parent component
//     toast({
//       title: "Agent Created!",
//       description: "The agent will be charged according to your plan.",
//       duration: 5000,
//     })
//     setIsLoading(false)
//     onClose() // Close the wizard
//     setStep(1) // Reset step for next time
//     setFormData({
//       // Reset form data
//       name: "",
//       persona: "",
//       goals: "",
//       voiceType: "predefined",
//       selectedVoiceId: predefinedVoices[0].id,
//       uploadedVoiceFile: null,
//     })
//   }

//   const currentVoiceAudioSrc =
//     formData.voiceType === "predefined" && formData.selectedVoiceId
//       ? predefinedVoices.find((v) => v.id === formData.selectedVoiceId)?.audioSrc
//       : formData.uploadedVoiceFile
//         ? URL.createObjectURL(formData.uploadedVoiceFile)
//         : undefined

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
//         <DialogHeader className="p-6 border-b border-gray-200">
//           <DialogTitle className="text-2xl font-bold text-gray-900">Add New Agent</DialogTitle>
//         </DialogHeader>
//         <div className="flex flex-1 overflow-hidden">
//           {/* Left Sidebar */}
//           <div className="w-64 bg-gradient-to-b from-teal-700 to-teal-900 text-white p-6 flex flex-col justify-between">
//             <div>
//               <h2 className="text-lg font-semibold mb-6">Question {step} of 3</h2>
//               <div className="space-y-6">
//                 {["Persona", "Goals", "Voice"].map((label, index) => (
//                   <div key={label} className="flex items-center space-x-3">
//                     <div
//                       className={cn(
//                         "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
//                         step === index + 1
//                           ? "bg-yellow-400 text-teal-900 ring-2 ring-yellow-400 ring-offset-2 ring-offset-teal-700"
//                           : "bg-white/20 text-white/70",
//                       )}
//                     >
//                       {index + 1}
//                     </div>
//                     <span
//                       className={cn(
//                         "text-lg font-medium transition-colors duration-300",
//                         step === index + 1 ? "text-white" : "text-white/70",
//                       )}
//                     >
//                       {label}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div className="text-sm text-white/60">
//             </div>
//           </div>

//           {/* Main Content */}
//           <div className="flex-1 p-8 flex flex-col justify-between overflow-auto">
//             {step === 1 && (
//               <div className="space-y-6">
//                 <h3 className="text-xl font-semibold text-gray-800">What is the desired persona of the agent?</h3>
//                 <p className="text-gray-600">
//                   Describe the personality of your agent. For example: You are a real estate assistant for Simple
//                   Realty. You work with both homeowners and homebuyers and are knowledgeable about trends in the housing
//                   market. You have helped many people accomplish their goals in regard to home buying or selling.
//                 </p>
//                 <Input
//                   id="name"
//                   placeholder="Enter agent name"
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   className="h-12 text-lg"
//                 />
//                 <Textarea
//                   id="persona"
//                   placeholder="Describe the agent's personality..."
//                   value={formData.persona}
//                   onChange={handleInputChange}
//                   rows={8}
//                   className="min-h-[150px]"
//                 />
//               </div>
//             )}

//             {step === 2 && (
//               <div className="space-y-6">
//                 <h3 className="text-xl font-semibold text-gray-800">
//                   What do you want SmartConvo agents to accomplish for you?
//                 </h3>
//                 <p className="text-gray-600">
//                   Describe the goal of the agent in a declarative manner. For example: Your goal is to determine what
//                   requirements would need to be met for the homeowner to want to sell their home.
//                 </p>
//                 <Textarea
//                   id="goals"
//                   placeholder="Describe the agent's goals..."
//                   value={formData.goals}
//                   onChange={handleInputChange}
//                   rows={8}
//                   className="min-h-[150px]"
//                 />
//               </div>
//             )}

//             {step === 3 && (
//               <div className="space-y-6">
//                 <h3 className="text-xl font-semibold text-gray-800">Voice Agent</h3>
//                 <RadioGroup
//                   value={formData.selectedVoiceId}
//                   onValueChange={handleVoiceSelection}
//                   className="grid grid-cols-3 gap-4"
//                 >
//                   {predefinedVoices.map((voice) => (
//                     <Label
//                       key={voice.id}
//                       htmlFor={voice.id}
//                       className={cn(
//                         "flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer transition-all duration-200",
//                         formData.selectedVoiceId === voice.id
//                           ? "border-teal-600 ring-2 ring-teal-600"
//                           : "hover:border-gray-300",
//                       )}
//                     >
//                       <RadioGroupItem value={voice.id} id={voice.id} className="sr-only" />
//                       <Avatar className="h-16 w-16 mb-3">
//                         <AvatarImage src={voice.avatar || "/placeholder.svg"} alt={voice.name} />
//                         <AvatarFallback>{voice.name.charAt(0)}</AvatarFallback>
//                       </Avatar>
//                       <span className="font-medium text-gray-900">{voice.name}</span>
//                       <span className="text-sm text-gray-500 text-center">{voice.description}</span>
//                       {formData.selectedVoiceId === voice.id && (
//                         <Check className="absolute top-2 right-2 h-5 w-5 text-teal-600" />
//                       )}
//                     </Label>
//                   ))}
//                 </RadioGroup>

//                 <div className="space-y-2">
//                   <h4 className="text-lg font-medium text-gray-800">Preview Voice</h4>
//                   {currentVoiceAudioSrc ? (
//                     <AudioPlayer src={currentVoiceAudioSrc} />
//                   ) : (
//                     <p className="text-gray-500 text-sm">Select a voice or upload your recording to preview.</p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <h4 className="text-lg font-medium text-gray-800">Upload your recording</h4>
//                   <div
//                     onDragOver={handleDragOver}
//                     onDrop={handleDrop}
//                     className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
//                   >
//                     <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
//                     <p className="text-gray-600">
//                       <Label
//                         htmlFor="voice-upload"
//                         className="text-teal-600 font-medium cursor-pointer hover:underline"
//                       >
//                         Drag & drop files or Browse
//                       </Label>
//                     </p>
//                     <Input
//                       id="voice-upload"
//                       type="file"
//                       accept="audio/mpeg"
//                       className="sr-only"
//                       onChange={handleVoiceFileUpload}
//                     />
//                     <p className="text-xs text-gray-500 mt-1">Suggested format: Mp3. Maximum duration: 5 minute</p>
//                     {formData.uploadedVoiceFile && (
//                       <p className="text-sm text-gray-700 mt-2">Selected: {formData.uploadedVoiceFile.name}</p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Navigation Buttons */}
//             <div className="flex justify-end gap-4 mt-8">
//               {step > 1 && (
//                 <Button variant="outline" onClick={handleBack} disabled={isLoading}>
//                   Back
//                 </Button>
//               )}
//               {step < 3 && (
//                 <Button onClick={handleNext} disabled={isLoading}>
//                   Next
//                 </Button>
//               )}
//               {step === 3 && (
//                 <Button onClick={handleSubmit} disabled={isLoading}>
//                   {isLoading ? "Finishing..." : "Finish"}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }



"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Check, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"
import { AudioPlayer } from "@/components/ui/audio-player"
import { useToast } from "@/hooks/use-toast"
import { useTutorial } from "@/components/tutorial/TutorialProvider"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { createStarterWorkflowDefinition } from "@/lib/workflow-studio/starterDefinition"



interface AddAgentWizardProps {
  isOpen: boolean
  onClose: () => void
  onAgentAdded: (agentData: any) => void
}

interface AgentFormData {
  name: string
  persona: string
  goals: string
  prompt: string
  type: "Inbound" | "Outbound"
  runtime: "standard" | "workflow"
  workflowArchitecture: "supervisor" | "linear"
  voiceType: "predefined" | "upload"
  selectedVoiceId?: string
  uploadedVoiceFile?: File | null
}

const predefinedVoices = [
  {
    id: "marissa",
    name: "Marissa",
    description: "your voice agent from Canada.",
    avatar: "/placeholder.svg?height=64&width=64",
    audioSrc: "/placeholder.svg?height=64&width=64",
  },
  {
    id: "scott",
    name: "Scott",
    description: "your voice agent from America.",
    avatar: "/placeholder.svg?height=64&width=64",
    audioSrc: "/placeholder.svg?height=64&width=64",
  },
  {
    id: "charlie",
    name: "Charlie",
    description: "your voice agent from UK.",
    avatar: "/placeholder.svg?height=64&width=64",
    audioSrc: "/placeholder.svg?height=64&width=64",
  },
]

export function AddAgentWizard({ isOpen, onClose, onAgentAdded }: AddAgentWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    persona: "",
    goals: "",
    prompt: "",
    type: "Inbound",
    runtime: "standard",
    workflowArchitecture: "supervisor",
    voiceType: "predefined",
    selectedVoiceId: predefinedVoices[0].id,
    uploadedVoiceFile: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { currentStep, nextStep, jumpToStep, markCheckpoint, isActive } = useTutorial()

// useEffect(() => {
//   const checkAndStartTutorial = async () => {
//     if (!isOpen) return; // Only proceed if modal/feature is open

//     try {
//       const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
//       const token = Cookies.get("Token") || "";
//       const headers = {
//         "Content-Type": "application/json",
//         Authorization: `Token ${token}`,
//       };

//       const res = await fetch(`${BASE_URL}/companies/get_tutorial/`, { method: "GET", headers });
//       if (!res.ok) throw new Error("Failed to fetch tutorial progress");

//       const data = await res.json();
//       const tutorialArray: number[] = data.tutorial_setup || [];

//       // Start tutorial only if "9" is NOT in the array
//       if (!tutorialArray.includes(9)) {
//         startTutorial();
//       }
//     } catch (err) {
//       console.error("Error checking tutorial progress:", err);
//     }
//   };

//   checkAndStartTutorial();
// }, [isOpen, startTutorial]);




  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleVoiceSelection = (voiceId: string) => {
    setFormData((prev) => ({ ...prev, voiceType: "predefined", selectedVoiceId: voiceId, uploadedVoiceFile: null }))
  }

  const handleVoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({ title: "Invalid file type", description: "Please upload an audio file (MP3, WAV, OGG).", variant: "destructive" })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" })
        return
      }
      setFormData((prev) => ({ ...prev, voiceType: "upload", uploadedVoiceFile: file, selectedVoiceId: undefined }))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({ title: "Invalid file type", description: "Please upload an audio file (MP3, WAV, OGG).", variant: "destructive" })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" })
        return
      }
      setFormData((prev) => ({ ...prev, voiceType: "upload", uploadedVoiceFile: file, selectedVoiceId: undefined }))
    }
  }

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      toast({ title: "Agent Name Required", description: "Please enter a name for your agent.", variant: "destructive" })
      return
    }
    if (step === 2 && !formData.persona.trim()) {
      toast({ title: "Agent Persona Required", description: "Please describe the agent's persona.", variant: "destructive" })
      return
    }
    if (step === 3 && (!formData.goals.trim() || !formData.prompt.trim())) {
      toast({ title: "Goals and Prompt Required", description: "Please complete both fields.", variant: "destructive" })
      return
    }
    // Sync tutorial with wizard navigation — jump to the right step regardless
    // of whether the user clicked tutorial Next or the wizard Next button.
    if (step === 1) {
      // Leaving wizard step 1 → tutorial should be on fill-goals-prompt
      if (currentStep === "fill-agent-name" || currentStep === "fill-persona" || currentStep === "click-next-step2") {
        jumpToStep("fill-goals-prompt")
      }
    }
    if (step === 2) {
      // Leaving wizard step 2 → tutorial should be on click-create-agent
      if (currentStep === "fill-goals-prompt" || currentStep === "fill-system-prompt" || currentStep === "click-next-step3") {
        jumpToStep("click-create-agent")
      }
    }
    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      const formPayload = new FormData()
      formPayload.append("name", formData.name)
      formPayload.append("persona", formData.persona)
      formPayload.append("goals", formData.goals)
      formPayload.append("instructions", formData.prompt)
      formPayload.append("type", formData.type)
      formPayload.append("status", "active")
      if (formData.runtime === "workflow") {
        formPayload.append("agent_type", "workflow")
        formPayload.append(
          "json_object",
          JSON.stringify(
            createStarterWorkflowDefinition(formData.workflowArchitecture),
          ),
        )
      }
      if (formData.uploadedVoiceFile) {
        formPayload.append("voice_clip", formData.uploadedVoiceFile)
      } else if (formData.selectedVoiceId) {
        formPayload.append("selected_voice", formData.selectedVoiceId)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${Cookies.get("Token") || ""}`,
        },
        body: formPayload,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null) // try to parse JSON
        console.error("Backend error:", errorData || await res.text())
        throw new Error(errorData?.error || "Failed to create agent")
      }


      const createdAgent = await res.json()
      onAgentAdded(createdAgent)

      toast({ title: "Agent Created!", description: "The agent will be charged according to your plan.", duration: 5000 })

      // Advance tutorial on agent creation
      if (currentStep === "click-create-agent") {
        markCheckpoint("agent", { agentId: createdAgent.id.toString() })
        nextStep()
      }

      setStep(1)
      setFormData({
        name: "",
        persona: "",
        goals: "",
        prompt: "",
        type: "Inbound",
        runtime: "standard",
        workflowArchitecture: "supervisor",
        voiceType: "predefined",
        selectedVoiceId: predefinedVoices[0].id,
        uploadedVoiceFile: null,
      })
      onClose()
      if (formData.runtime === "workflow") {
        router.push(`/dashboard/workflow-studio?agentId=${createdAgent.id}`)
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Unable to create agent.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const uploadedVoiceBlobUrl = useMemo(() => {
    if (formData.voiceType === "upload" && formData.uploadedVoiceFile) {
      return URL.createObjectURL(formData.uploadedVoiceFile)
    }
    return null
  }, [formData.voiceType, formData.uploadedVoiceFile])

  useEffect(() => {
    if (!uploadedVoiceBlobUrl) return
    return () => URL.revokeObjectURL(uploadedVoiceBlobUrl)
  }, [uploadedVoiceBlobUrl])

  const currentVoiceAudioSrc =
    formData.voiceType === "predefined" && formData.selectedVoiceId
      ? predefinedVoices.find((v) => v.id === formData.selectedVoiceId)?.audioSrc
      : uploadedVoiceBlobUrl ?? undefined

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl h-[90vh] p-0 flex flex-col rounded-2xl overflow-hidden"
        onPointerDownOutside={(e) => { if (isActive) e.preventDefault() }}
        onInteractOutside={(e) => { if (isActive) e.preventDefault() }}
      >
        <DialogHeader className="p-6 border-b border-slate-100 bg-white">
          <DialogTitle className="text-2xl font-light text-slate-900 tracking-tight">Add New Agent</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Progress</p>
              <h2 className="text-lg font-light mb-8">Step {step} of 3</h2>
              <div className="space-y-1">
                {["Persona", "Goals", "Voice"].map((label, index) => {
                  const stepNum = index + 1
                  const isActive = step === stepNum
                  const isCompleted = step > stepNum
                  return (
                    <div key={label} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${isActive ? "bg-white/10" : ""}`}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300",
                        isActive ? "bg-white text-slate-900" : isCompleted ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-500"
                      )}>
                        {isCompleted ? "✓" : stepNum}
                      </div>
                      <span className={cn("text-sm font-medium transition-colors duration-300", isActive ? "text-white" : "text-slate-500")}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-8">
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Form content */}
          <div className="flex-1 p-8 flex flex-col justify-between overflow-auto bg-gradient-to-br from-white to-slate-50/50">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-slate-900 mb-1">Define the persona</h3>
                  <p className="text-sm text-slate-500">Describe your agent's personality and give it a name.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Agent Name</label>
                  <Input 
                    id="name" 
                    className="h-11 text-base border-slate-200 focus:border-slate-400 agent-modal-input-name" 
                    placeholder="e.g. Customer Support Agent" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Persona</label>
                  <Textarea 
                    id="persona" 
                    placeholder="Describe the agent's personality, tone, behavior..." 
                    value={formData.persona} 
                    onChange={handleInputChange} 
                    rows={8} 
                    className="min-h-[150px] border-slate-200 focus:border-slate-400 resize-y" 
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-slate-900 mb-1">Set goals & instructions</h3>
                  <p className="text-sm text-slate-500">What should this agent accomplish? Add goals and a system prompt.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Runtime</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      {
                        value: "standard",
                        title: "Prompt based",
                        description: "Use a system prompt and assigned tools.",
                      },
                      {
                        value: "workflow",
                        title: "Workflow based",
                        description: "Start with a router and build visual workflows.",
                      },
                    ] as const).map((option) => {
                      const selected = formData.runtime === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setFormData((previous) => ({
                              ...previous,
                              runtime: option.value,
                            }))
                          }
                          className={cn(
                            "rounded-xl border p-4 text-left transition-all",
                            selected
                              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                          )}
                        >
                          <span className="block text-sm font-semibold">
                            {option.title}
                          </span>
                          <span
                            className={cn(
                              "mt-1 block text-xs",
                              selected ? "text-slate-300" : "text-slate-500",
                            )}
                          >
                            {option.description}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {formData.runtime === "workflow" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Workflow architecture</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        {
                          value: "supervisor",
                          title: "Supervisor",
                          description: "A router selects focused task workflows.",
                        },
                        {
                          value: "linear",
                          title: "Linear",
                          description: "Blocks follow deterministic condition branches.",
                        },
                      ] as const).map((option) => {
                        const selected = formData.workflowArchitecture === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setFormData((previous) => ({ ...previous, workflowArchitecture: option.value }))}
                            className={cn(
                              "rounded-xl border p-3 text-left transition-all",
                              selected
                                ? "border-cyan-600 bg-cyan-50 text-slate-900"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                            )}
                          >
                            <span className="block text-sm font-semibold">{option.title}</span>
                            <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-900 cursor-pointer">Call direction</label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formData.type === "Outbound" ? "This agent will initiate conversations" : "This agent will respond to incoming calls"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium transition-colors ${formData.type === "Inbound" ? "text-slate-900" : "text-slate-400"}`}>
                      Inbound
                    </span>
                    <Switch
                      checked={formData.type === "Outbound"}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, type: checked ? "Outbound" : "Inbound" }))}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className={`text-sm font-medium transition-colors ${formData.type === "Outbound" ? "text-blue-600" : "text-slate-400"}`}>
                      Outbound
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Goals</label>
                  <Textarea id="goals" placeholder="Describe the agent's goals..." value={formData.goals} onChange={handleInputChange} rows={6} className="min-h-[100px] border-slate-200 focus:border-slate-400 resize-y" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">System Prompt</label>
                  <Textarea id="prompt" placeholder="Add the system prompt..." value={formData.prompt} onChange={handleInputChange} rows={6} className="min-h-[100px] border-slate-200 focus:border-slate-400 resize-y" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-slate-900 mb-1">Choose a voice</h3>
                  <p className="text-sm text-slate-500">Select a predefined voice or upload your own recording.</p>
                </div>
                <RadioGroup
                  value={formData.selectedVoiceId}
                  onValueChange={handleVoiceSelection}
                  className="radio-group grid grid-cols-3 gap-4"
                >
                  {predefinedVoices.map((voice) => (
                    <Label
                      key={voice.id}
                      htmlFor={voice.id}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border-2 p-5 cursor-pointer transition-all duration-200",
                        formData.selectedVoiceId === voice.id
                          ? "border-slate-900 bg-slate-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                      )}
                    >
                      <RadioGroupItem value={voice.id} id={voice.id} className="sr-only" />
                      <Avatar className="h-14 w-14 mb-3">
                        <AvatarImage src={voice.avatar || "/placeholder.svg"} alt={voice.name} />
                        <AvatarFallback className="bg-slate-200 text-slate-600 font-medium">{voice.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900 text-sm">{voice.name}</span>
                      <span className="text-xs text-slate-500 text-center mt-0.5">{voice.description}</span>
                      {formData.selectedVoiceId === voice.id && (
                        <Check className="absolute top-2 right-2 h-4 w-4 text-slate-900" />
                      )}
                    </Label>
                  ))}
                </RadioGroup>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700">Preview Voice</h4>
                  {currentVoiceAudioSrc ? (
                    <AudioPlayer src={currentVoiceAudioSrc} />
                  ) : (
                    <p className="text-sm text-slate-400">Select a voice or upload a recording to preview.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-700">Upload Recording</h4>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition-all"
                  >
                    <UploadCloud className="h-7 w-7 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-600">
                      <Label htmlFor="voice-upload" className="text-slate-900 font-medium cursor-pointer hover:underline">
                        Browse files
                      </Label>{" "}
                      or drag & drop
                    </p>
                    <Input id="voice-upload" type="file" accept="audio/*" className="sr-only" onChange={handleVoiceFileUpload} />
                    <p className="text-xs text-slate-400 mt-1">MP3, WAV, OGG • Max 5MB</p>
                    {formData.uploadedVoiceFile && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-100 px-3 py-1 rounded-full">Selected: {formData.uploadedVoiceFile.name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-4 mt-8 pt-4 border-t border-slate-100">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack} disabled={isLoading} className="text-sm border-slate-200">Back</Button>
              ) : <div />}
              {step < 3 && (
                <Button onClick={handleNext} disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white text-sm agent-modal-next-btn">Next</Button>
              )}

             {step === 3 && (
  <Button
    onClick={async () => {
      setIsLoading(true);
      try {
        await handleSubmit();
      } catch (err) {
        console.error("Error creating agent:", err);
      } finally {
        setIsLoading(false);
      }
    }}
    disabled={isLoading}
    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm agent-modal-finish-btn"
  >
    {isLoading ? "Creating..." : "Create Agent"}
  </Button>
)}


            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


// "use client"

// import type * as React from "react"
// import { useState } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Check, UploadCloud } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { AudioPlayer } from "@/components/ui/audio-player"
// import { useToast } from "@/hooks/use-toast"
// import Cookies from "js-cookie"
// import { useRouter } from "next/navigation"


// interface AddAgentWizardProps {
//   isOpen: boolean
//   onClose: () => void
//   onAgentAdded: (agentData: any) => void
// }

// interface AgentFormData {
//   name: string
//   persona: string
//   goals: string
//   prompt: string
//   voiceType: "predefined" | "upload"
//   selectedVoiceId?: string
//   uploadedVoiceFile?: File | null
// }

// const predefinedVoices = [
//   {
//     id: "marissa",
//     name: "Marissa",
//     description: "your voice agent from Canada.",
//     avatar: "/placeholder.svg?height=64&width=64",
//     audioSrc: "/placeholder.svg?height=64&width=64",
//   },
//   {
//     id: "scott",
//     name: "Scott",
//     description: "your voice agent from America.",
//     avatar: "/placeholder.svg?height=64&width=64",
//     audioSrc: "/placeholder.svg?height=64&width=64",
//   },
//   {
//     id: "charlie",
//     name: "Charlie",
//     description: "your voice agent from UK.",
//     avatar: "/placeholder.svg?height=64&width=64",
//     audioSrc: "/placeholder.svg?height=64&width=64",
//   },
// ]

// export function AddAgentWizard({ isOpen, onClose, onAgentAdded }: AddAgentWizardProps) {
//   const router = useRouter()
//   const [step, setStep] = useState(1)
//   const [formData, setFormData] = useState<AgentFormData>({
//     name: "",
//     persona: "",
//     goals: "",
//     prompt: "",
//     voiceType: "predefined",
//     selectedVoiceId: predefinedVoices[0].id,
//     uploadedVoiceFile: null,
//   })
//   const [isLoading, setIsLoading] = useState(false)
//   const { toast } = useToast()

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { id, value } = e.target
//     setFormData((prev) => ({ ...prev, [id]: value }))
//   }

//   const handleVoiceSelection = (voiceId: string) => {
//     setFormData((prev) => ({ ...prev, voiceType: "predefined", selectedVoiceId: voiceId, uploadedVoiceFile: null }))
//   }

//   const handleVoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       if (file.type !== "audio/mpeg") {
//         toast({ title: "Invalid file type", description: "Please upload an MP3 file.", variant: "destructive" })
//         return
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" })
//         return
//       }
//       setFormData((prev) => ({ ...prev, voiceType: "upload", uploadedVoiceFile: file, selectedVoiceId: undefined }))
//     }
//   }

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     e.stopPropagation()
//   }

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault()
//     e.stopPropagation()
//     const file = e.dataTransfer.files?.[0]
//     if (file) {
//       if (file.type !== "audio/mpeg") {
//         toast({ title: "Invalid file type", description: "Please upload an MP3 file.", variant: "destructive" })
//         return
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" })
//         return
//       }
//       setFormData((prev) => ({ ...prev, voiceType: "upload", uploadedVoiceFile: file, selectedVoiceId: undefined }))
//     }
//   }

//   const handleNext = () => {
//     if (step === 1 && !formData.name.trim()) {
//       toast({ title: "Agent Name Required", description: "Please enter a name for your agent.", variant: "destructive" })
//       return
//     }
//     if (step === 2 && !formData.persona.trim()) {
//       toast({ title: "Agent Persona Required", description: "Please describe the agent's persona.", variant: "destructive" })
//       return
//     }
//     if (step === 3 && (!formData.goals.trim() || !formData.prompt.trim())) {
//       toast({ title: "Goals and Prompt Required", description: "Please complete both fields.", variant: "destructive" })
//       return
//     }
//     setStep((prev) => prev + 1)
//   }

//   const handleBack = () => {
//     setStep((prev) => prev - 1)
//   }

//   const handleSubmit = async () => {
//     try {
//       setIsLoading(true)
//       console.log("Submitting agent data:", formData.name,
//           formData.persona,
//           formData.goals,
//           formData.prompt)

//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/agents/agents/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Token ${Cookies.get("Token") || ""}`,
//         },
//         body: JSON.stringify({
//           name: formData.name,
//           persona: formData.persona,
//           goals: formData.goals,
//           instructions: formData.prompt,
//           //voice: formData.selectedVoiceId || "uploaded-voice",
//           status: "active",
//         }),
//       })

//       if (!res.ok) throw new Error("Failed to create agent")

//       const createdAgent = await res.json()
//       onAgentAdded(createdAgent)

//       toast({ title: "Agent Created!", description: "The agent will be charged according to your plan.", duration: 5000 })

//       setStep(1)
//       setFormData({
//         name: "",
//         persona: "",
//         goals: "",
//         prompt: "",
//         voiceType: "predefined",
//         selectedVoiceId: predefinedVoices[0].id,
//         uploadedVoiceFile: null,
//       })
//       //router.push("/dashboard/agents")
//       onClose()
//     } catch (error) {
//       console.error(error)
//       toast({ title: "Error", description: "Unable to create agent.", variant: "destructive" })
//     } finally {
//       setIsLoading(false)
//     }

    
//   }

//   const currentVoiceAudioSrc =
//     formData.voiceType === "predefined" && formData.selectedVoiceId
//       ? predefinedVoices.find((v) => v.id === formData.selectedVoiceId)?.audioSrc
//       : formData.uploadedVoiceFile
//         ? URL.createObjectURL(formData.uploadedVoiceFile)
//         : undefined

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
//         <DialogHeader className="p-6 border-b border-gray-200">
//           <DialogTitle className="text-2xl font-bold text-gray-900">Add New Agent</DialogTitle>
//         </DialogHeader>
//         <div className="flex flex-1 overflow-hidden">
//           <div className="w-64 bg-gradient-to-b from-teal-700 to-teal-900 text-white p-6 flex flex-col justify-between">
//             <div>
//               <h2 className="text-lg font-semibold mb-6">Question {step} of 3</h2>
//               <div className="space-y-6">
//                 {["Persona", "Goals", "Voice"].map((label, index) => (
//                   <div key={label} className="flex items-center space-x-3">
//                     <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300", step === index + 1 ? "bg-yellow-400 text-teal-900 ring-2 ring-yellow-400 ring-offset-2 ring-offset-teal-700" : "bg-white/20 text-white/70")}>{index + 1}</div>
//                     <span className={cn("text-lg font-medium transition-colors duration-300", step === index + 1 ? "text-white" : "text-white/70")}>{label}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           <div className="flex-1 p-8 flex flex-col justify-between overflow-auto">
//             {step === 1 && (
//               <div className="space-y-6">
//                 <h3 className="text-xl font-semibold text-gray-800">What is the desired persona of the agent?</h3>
//                 <p className="text-gray-600">Describe the personality of your agent...</p>
//                 <Input id="name" placeholder="Enter agent name" value={formData.name} onChange={handleInputChange} className="h-12 text-lg" />
//                 <Textarea id="persona" placeholder="Describe the agent's personality..." value={formData.persona} onChange={handleInputChange} rows={8} className="min-h-[150px]" />
//               </div>
//             )}

//             {step === 2 && (
//               <div className="space-y-6">
//                 <h3 className="text-xl font-semibold text-gray-800">What do you want SmartConvo agents to accomplish for you?</h3>
//                 <p className="text-gray-600">Describe the goal of the agent in a declarative manner...</p>
//                 <Textarea id="goals" placeholder="Describe the agent's goals..." value={formData.goals} onChange={handleInputChange} rows={6} className="min-h-[100px]" />
//                 <Textarea id="prompt" placeholder="Add the system prompt..." value={formData.prompt} onChange={handleInputChange} rows={6} className="min-h-[100px]" />
//               </div>
//             )}

//             {/* step 3 remains unchanged */}
//              {step === 3 && (
//               <div className="space-y-6">
//                 <h3 className="text-xl font-semibold text-gray-800">Voice Agent</h3>
//                 <RadioGroup
//                   value={formData.selectedVoiceId}
//                   onValueChange={handleVoiceSelection}
//                   className="grid grid-cols-3 gap-4"
//                 >
//                   {predefinedVoices.map((voice) => (
//                     <Label
//                       key={voice.id}
//                       htmlFor={voice.id}
//                       className={cn(
//                         "flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer transition-all duration-200",
//                         formData.selectedVoiceId === voice.id
//                           ? "border-teal-600 ring-2 ring-teal-600"
//                           : "hover:border-gray-300",
//                       )}
//                     >
//                       <RadioGroupItem value={voice.id} id={voice.id} className="sr-only" />
//                       <Avatar className="h-16 w-16 mb-3">
//                         <AvatarImage src={voice.avatar || "/placeholder.svg"} alt={voice.name} />
//                         <AvatarFallback>{voice.name.charAt(0)}</AvatarFallback>
//                       </Avatar>
//                       <span className="font-medium text-gray-900">{voice.name}</span>
//                       <span className="text-sm text-gray-500 text-center">{voice.description}</span>
//                       {formData.selectedVoiceId === voice.id && (
//                         <Check className="absolute top-2 right-2 h-5 w-5 text-teal-600" />
//                       )}
//                     </Label>
//                   ))}
//                 </RadioGroup>

//                 <div className="space-y-2">
//                   <h4 className="text-lg font-medium text-gray-800">Preview Voice</h4>
//                   {currentVoiceAudioSrc ? (
//                     <AudioPlayer src={currentVoiceAudioSrc} />
//                   ) : (
//                     <p className="text-gray-500 text-sm">Select a voice or upload your recording to preview.</p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <h4 className="text-lg font-medium text-gray-800">Upload your recording</h4>
//                   <div
//                     onDragOver={handleDragOver}
//                     onDrop={handleDrop}
//                     className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
//                   >
//                     <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
//                     <p className="text-gray-600">
//                       <Label
//                         htmlFor="voice-upload"
//                         className="text-teal-600 font-medium cursor-pointer hover:underline"
//                       >
//                         Drag & drop files or Browse
//                       </Label>
//                     </p>
//                     <Input
//                       id="voice-upload"
//                       type="file"
//                       accept="audio/mpeg"
//                       className="sr-only"
//                       onChange={handleVoiceFileUpload}
//                     />
//                     <p className="text-xs text-gray-500 mt-1">Suggested format: Mp3. Maximum duration: 5 minute</p>
//                     {formData.uploadedVoiceFile && (
//                       <p className="text-sm text-gray-700 mt-2">Selected: {formData.uploadedVoiceFile.name}</p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="flex justify-end gap-4 mt-8">
//               {step > 1 && (<Button variant="outline" onClick={handleBack} disabled={isLoading}>Back</Button>)}
//               {step < 3 && (<Button onClick={handleNext} disabled={isLoading}>Next</Button>)}
//               {step === 3 && (<Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? "Finishing..." : "Finish"}</Button>)}
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }


