"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Eye, EyeOff, Upload, User, Lock, Camera } from "lucide-react"
import Cookies from "js-cookie"

export default function FirstTimeSetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Password step state
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  })

  // Image step state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is actually a first-time user
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login")
      return
    }
    console.log(user)

    const userData = JSON.parse(user)
    if (userData.previous_last_login !== null) {
      // User has logged in before, redirect to dashboard
      router.push("/dashboard")
    }
  }, [router])

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        ...(password.length < minLength ? ["At least 8 characters"] : []),
        ...(!hasUpperCase ? ["One uppercase letter"] : []),
        ...(!hasLowerCase ? ["One lowercase letter"] : []),
        ...(!hasNumbers ? ["One number"] : []),
        ...(!hasSpecialChar ? ["One special character"] : []),
      ],
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    const validation = validatePassword(passwords.newPassword)
    if (!validation.isValid) {
      toast({
        title: "Password Requirements",
        description: "Password must meet all requirements: " + validation.errors.join(", "),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      
       const user = localStorage.getItem("user")
       const userData = user ? JSON.parse(user) : null
       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company-users/me/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${Cookies.get("Token") || ""}`,
        },
        body: JSON.stringify({
          password: passwords.newPassword,
          confirm_password: passwords.confirmPassword,
        }),
      })
      console.log("Password update response:", response)
      if (response.ok) {
        setCurrentStep(2)
      } else {
        const errorData = await response.json()
        console.error("Password update failed:", errorData)
        alert("Failed to update password. Please try again.")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file",
          variant: "destructive",
        })
        return
      }

      setSelectedImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!selectedImage) {
    toast({
      title: "No image selected",
      description: "Please select a profile picture",
      variant: "destructive",
    })
    return
  }

  setIsLoading(true)

  try {
    const formData = new FormData()
    formData.append("image", selectedImage)

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company-users/me/`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${Cookies.get("Token") || ""}`,
        // No need to set Content-Type — browser will set it automatically for FormData
      },
      body: formData,
    })

    const data = await response.json()
    if (response.ok) {
      const updatedUser = {
        ...JSON.parse(localStorage.getItem("user") || "{}"),
        profilePic: data.profile_picture || imagePreview, // updated image URL from backend
        lastLogin: new Date().toISOString(),
        status: "Active",
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))

      toast({
        title: "Setup Complete",
        description: "Welcome to Smart Convo! Redirecting to your dashboard...",
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } else {
      console.error("Image upload error:", data)
      toast({
        title: "Upload Failed",
        description: "Something went wrong while uploading the image.",
        variant: "destructive",
      })
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to upload image. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsLoading(false)
  }
}


  const skipImageUpload = () => {
    // Complete setup without image
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString(),
      status: "Active",
    }
    localStorage.setItem("user", JSON.stringify(updatedUser))

    toast({
      title: "Setup Complete",
      description: "Welcome to Smart Convo! Redirecting to your dashboard...",
    })

    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
              {currentStep === 1 ? <Lock className="w-6 h-6 text-white" /> : <Camera className="w-6 h-6 text-white" />}
            </div>
            <span className="text-2xl font-bold text-slate-800">Smart Convo</span>
          </div>

          <div>
            <CardTitle className="text-2xl text-slate-800">
              {currentStep === 1 ? "Set Your Password" : "Add Profile Picture"}
            </CardTitle>
            <p className="text-slate-600 mt-2">
              {currentStep === 1
                ? "Create a secure password for your account"
                : "Upload a profile picture to personalize your account"}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Step {currentStep} of 2</span>
              <span>{currentStep === 1 ? 50 : 100}%</span>
            </div>
            <Progress value={currentStep === 1 ? 50 : 100} className="h-2" />
          </div>
        </CardHeader>

        <CardContent>
          {currentStep === 1 ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-700">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.newPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, newPassword: !showPasswords.newPassword })}
                  >
                    {showPasswords.newPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })
                    }
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password requirements */}
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-2">Password Requirements:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${passwords.newPassword.length >= 8 ? "bg-green-500" : "bg-slate-300"}`}
                    />
                    At least 8 characters
                  </li>
                  <li className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(passwords.newPassword) ? "bg-green-500" : "bg-slate-300"}`}
                    />
                    One uppercase letter
                  </li>
                  <li className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(passwords.newPassword) ? "bg-green-500" : "bg-slate-300"}`}
                    />
                    One lowercase letter
                  </li>
                  <li className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${/\d/.test(passwords.newPassword) ? "bg-green-500" : "bg-slate-300"}`}
                    />
                    One number
                  </li>
                  <li className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(passwords.newPassword) ? "bg-green-500" : "bg-slate-300"}`}
                    />
                    One special character
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleImageSubmit} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-teal-100"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full bg-transparent"
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                )}

                <div className="w-full">
                  <Label htmlFor="profileImage" className="cursor-pointer">
                    <div className="flex items-center justify-center w-full h-12 border-2 border-dashed border-slate-300 rounded-lg hover:border-teal-400 transition-colors">
                      <Upload className="w-5 h-5 mr-2 text-slate-500" />
                      <span className="text-slate-600">Choose Profile Picture</span>
                    </div>
                  </Label>
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">JPG, PNG or GIF (max 5MB)</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={isLoading || !selectedImage}
                >
                  {isLoading ? "Uploading..." : "Complete Setup"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-transparent"
                  onClick={skipImageUpload}
                  disabled={isLoading}
                >
                  Skip for Now
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
