"use client"


import { useState } from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Mail, CheckCircle, Copy, UserPlus, Users, Shield, Clock, Calendar } from "lucide-react"
import Cookies from "js-cookie"
import { Loader2 } from "lucide-react"



interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "member"
  status: "Active" | "Inactive" | "Pending"
  companyId: string // Assuming current company's ID
  profilePic: string | null
  lastLogin: string | null // ISO date string or null
  dateCreated: string // ISO date string
}


// Dummy data for users
const initialUsers: UserData[] = [
  {
    id: "user1",
    firstName: "Alice",
    lastName: "Smith",
    email: "alice@example.com",
    role: "admin",
    status: "Active",
    companyId: "company123",
    profilePic: "/placeholder.svg?height=64&width=64",
    lastLogin: "2024-07-14T10:00:00Z",
    dateCreated: "2024-01-10T09:00:00Z",
  },
  {
    id: "user2",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob@example.com",
    role: "member",
    status: "Pending",
    companyId: "company123",
    profilePic: null,
    lastLogin: null,
    dateCreated: "2024-07-15T11:30:00Z",
  },
  {
    id: "user3",
    firstName: "Charlie",
    lastName: "Brown",
    email: "charlie@example.com",
    role: "member",
    status: "Inactive",
    companyId: "company123",
    profilePic: "/placeholder.svg?height=64&width=64",
    lastLogin: "2024-06-20T14:00:00Z",
    dateCreated: "2024-03-01T10:00:00Z",
  },
]



export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isManageUserModalOpen, setIsManageUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const { toast } = useToast()


  // State for Add User form
  const [newUserData, setNewUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "member" as "admin" | "member",
  })
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [addUserLoading, setAddUserLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)



  // State for Manage User form
  const [manageUserRole, setManageUserRole] = useState<"admin" | "member">("member")
  const [manageUserStatus, setManageUserStatus] = useState<"Active" | "Inactive">("Active")
  const [manageUserLoading, setManageUserLoading] = useState(false)


  useEffect(() => {
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)


      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company-users/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${Cookies.get("Token") || ""}`,
        },
      })


      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }


      const data = await response.json()
      console.log("Fetched users:", data)
  


      const mappedUsers = data.map((user: any, index: number) => ({
        id: user.id || `user${index + 1}`,
        firstName: user.user_first_name,
        lastName: user.user_last_name,
        email: user.user_email,
        role: user.role,
        status: user.status || "Pending",
        companyId: user.user_company || "company123",
        profilePic: user.image || "/placeholder.svg?height=64&width=64",
        lastLogin: user.user_last_login || null,
        dateCreated: user.user_date_joined || new Date().toISOString(),
      }))


      console.log("Mapped users:", mappedUsers)


      setUsers(mappedUsers)
    } catch (error: any) {
      console.error("Error fetching users:", error.message)
      toast({
        title: "Error loading users",
        description: error.message || "Could not fetch users from server.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUsers(false)
    }
  }


  fetchUsers()
}, [])



  const generateRandomPassword = (length = 12) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }


  const handleSendOtp = async () => {
    if (!newUserData.email || !/\S+@\S+\.\S+/.test(newUserData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }
    setAddUserLoading(true)
    // Simulate OTP sending
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setOtpSent(true)
    toast({
      title: "OTP Sent",
      description: "A verification code has been sent to your email.",
    })
    setAddUserLoading(false)
  }


  const handleVerifyOtp = async () => {
    if (otp === "123456") {
      // Demo OTP
      setAddUserLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setOtpVerified(true)
      toast({
        title: "OTP Verified",
        description: "Email successfully verified.",
      })
      setAddUserLoading(false)
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter the correct verification code.",
        variant: "destructive",
      })
    }


  }



  const handleAddUserSubmit = async () => {
  if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || !otpVerified) {
    toast({
      title: "Missing Information",
      description: "Please fill all fields and verify email.",
      variant: "destructive",
    })
    return
  }


  setAddUserLoading(true)
  const newPassword = generateRandomPassword()
  setGeneratedPassword(newPassword)


  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company-users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${Cookies.get("Token") || ""}`, // Use token from cookies
      },
      body: JSON.stringify({
        email: newUserData.email,
        password: newPassword,
        first_name: newUserData.firstName,
        last_name: newUserData.lastName,
        role: newUserData.role
      }),
    })
    const responseData = await response.json()


    if (!response.ok) {
      throw new Error(responseData.message || "Failed to create user")
    }


    if (responseData.role) {
      toast({
        title: "User Added Successfully!",
        description: "Random password generated. Please provide it to the user.",
      })
    }



    // Add to local UI state 
    const newUser: UserData = {
      id: `user${users.length + 1}`,
      firstName: newUserData.firstName,
      lastName: newUserData.lastName,
      email: newUserData.email,
      role: newUserData.role,
      status: "Pending",
      companyId: "company123",
      profilePic: null,
      lastLogin: null,
      dateCreated: new Date().toISOString(),
    }


    setUsers((prev) => [...prev, newUser])
    toast({
      title: "User Added Successfully!",
      description: "Random password generated. Please provide it to the user.",
    })
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Something went wrong.",
      variant: "destructive",
    })
  }


  setAddUserLoading(false)
}



  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword)
    toast({
      title: "Password Copied!",
      description: "The generated password has been copied to your clipboard.",
    })
    setIsAddUserModalOpen(false)
    setNewUserData({ firstName: "", lastName: "", email: "", role: "member" })
    setOtp("")
    setOtpSent(false)
    setOtpVerified(false)
    setGeneratedPassword("")
  }


  const openManageUserModal = (user: UserData) => {
    setSelectedUser(user)
    setManageUserRole(user.role)
    setManageUserStatus(user.status === "Active" ? "Active" : "Inactive") // Only Active/Inactive for management
    setIsManageUserModalOpen(true)
  }


  const handleManageUserSubmit = async () => {
    if (!selectedUser) return


    try {
      setManageUserLoading(true)



      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company-users/${selectedUser.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${Cookies.get("Token") || ""}`, // Use token from cookies
        },
        body: JSON.stringify({
          role: manageUserRole,
          status: manageUserStatus.toLowerCase(),
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update user")
      }


      const updatedUser = await response.json()


      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? { ...user, ...updatedUser } : user)),
      )


      toast({
        title: "User Updated",
        description: `${selectedUser.firstName} ${selectedUser.lastName}'s profile has been updated.`,
      })
    } catch (err) {
      console.error("Update user error:", err)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setManageUserLoading(false)
      setIsManageUserModalOpen(false)
      setSelectedUser(null)
    }
  }



  const handleDeleteUser = async () => {
    if (!selectedUser) return


    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}?`,
    )
    if (!confirmed) return


    try {
      setManageUserLoading(true)


      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/company-users/${selectedUser.id}/`, {
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${Cookies.get("Token") || ""}`, // Use token from cookies
      },
      })


      if (!response.ok) {
        throw new Error("Failed to delete user")
      }


      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id))


      toast({
        title: "User Deleted",
        description: `${selectedUser.firstName} ${selectedUser.lastName} has been removed.`,
        variant: "destructive",
      })
    } catch (err) {
      console.error("Delete user error:", err)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setManageUserLoading(false)
      setIsManageUserModalOpen(false)
      setSelectedUser(null)
    }
  }



  const getStatusColor = (status: UserData["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-green-700 border border-green-200"
      case "Inactive":
        return "bg-red-50 text-red-700 border border-red-200"
      case "Pending":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200"
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200"
    }
  }

  const activeUsers = users.filter(u => u.status === "Active").length
  const adminUsers = users.filter(u => u.role === "admin").length
  const pendingUsers = users.filter(u => u.status === "Pending").length


  if (isLoadingUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-light tracking-wide">Loading users...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
              <div>
                <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                  Team Members
                </h1>
                <p className="text-lg text-slate-500 font-light tracking-wide">
                  Manage your team and control access permissions
                </p>
              </div>
            </div>

            <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
              <DialogTrigger asChild>
                <button className="group px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
                  <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-light">Add User</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-light text-slate-900">Add New User</DialogTitle>
                </DialogHeader>
                {!generatedPassword ? (
                  <div className="grid gap-5 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-light text-slate-700">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={newUserData.firstName}
                        onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                        className="rounded-xl border-slate-200"
                        disabled={addUserLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-light text-slate-700">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={newUserData.lastName}
                        onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                        className="rounded-xl border-slate-200"
                        disabled={addUserLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-light text-slate-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        className="rounded-xl border-slate-200"
                        disabled={otpSent || addUserLoading}
                      />
                    </div>
                    {!otpVerified && (
                      <div className="space-y-2">
                        <Label htmlFor="otp" className="text-sm font-light text-slate-700">
                          OTP Verification
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="rounded-xl border-slate-200 flex-1"
                            placeholder="Enter OTP"
                            disabled={!otpSent || otpVerified || addUserLoading}
                          />
                          {!otpSent ? (
                            <Button onClick={handleSendOtp} className="rounded-xl bg-slate-900 hover:bg-slate-800" disabled={addUserLoading}>
                              {addUserLoading ? "Sending..." : "Send OTP"}
                            </Button>
                          ) : (
                            <Button onClick={handleVerifyOtp} className="rounded-xl bg-slate-900 hover:bg-slate-800" disabled={otpVerified || addUserLoading}>
                              {addUserLoading ? "Verifying..." : "Verify"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    {otpVerified && (
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-light text-slate-700">
                          Role
                        </Label>
                        <Select
                          value={newUserData.role}
                          onValueChange={(value: "admin" | "member") => setNewUserData({ ...newUserData, role: value })}
                          disabled={addUserLoading}
                        >
                          <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleAddUserSubmit} disabled={!otpVerified || addUserLoading} className="rounded-xl bg-slate-900 hover:bg-slate-800">
                        {addUserLoading ? "Creating..." : "Create User"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-light mb-2 text-slate-900">User Created Successfully!</h3>
                    <p className="text-slate-600 font-light mb-6 text-sm">
                      Please provide the following password to the new user. They will be prompted to change it on first
                      login.
                    </p>
                    <div className="relative flex items-center border border-slate-200 rounded-xl p-4 bg-slate-50 mb-6">
                      <Input
                        type="text"
                        value={generatedPassword}
                        readOnly
                        className="flex-1 border-none bg-transparent focus-visible:ring-0 font-mono"
                      />
                      <Button variant="ghost" size="sm" onClick={handleCopyPassword} className="ml-2 hover:bg-slate-200 rounded-lg">
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <Button onClick={handleCopyPassword} className="rounded-xl bg-slate-900 hover:bg-slate-800">Done</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-300">
                  <Users className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{users.length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Total Users</p>
            </div>

            <div className="group bg-white border border-green-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
                  <CheckCircle className="w-6 h-6 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                  {users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{activeUsers}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Active Users</p>
            </div>

            <div className="group bg-white border border-purple-200 rounded-2xl p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all duration-300">
                  <Shield className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
                  {users.length > 0 ? Math.round((adminUsers / users.length) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{adminUsers}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Administrators</p>
            </div>

            <div className="group bg-white border border-yellow-200 rounded-2xl p-6 hover:shadow-lg hover:border-yellow-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center group-hover:bg-yellow-500 group-hover:scale-110 transition-all duration-300">
                  <Clock className="w-6 h-6 text-yellow-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-full">
                  {users.length > 0 ? Math.round((pendingUsers / users.length) * 100) : 0}%
                </div>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{pendingUsers}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {users.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-500 font-light text-lg">No users found</p>
            <p className="text-slate-400 text-sm mt-2">Click "Add User" to invite new team members</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-slate-100">
                      <AvatarImage src={user.profilePic || undefined} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-lg font-light">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-light text-slate-900 truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 truncate font-light">
                        <Mail className="h-3 w-3 flex-shrink-0" /> 
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-light flex items-center gap-2">
                        <Shield className="w-3 h-3" /> Role
                      </span>
                      <span className="text-sm text-slate-900 font-light capitalize">{user.role}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-light">Status</span>
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-light", getStatusColor(user.status))}>
                        {user.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-light flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Joined
                      </span>
                      <span className="text-sm text-slate-900 font-light">{new Date(user.dateCreated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-light flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Last Login
                      </span>
                      <span className="text-sm text-slate-900 font-light">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</span>
                    </div>
                  </div>

                  <button
                    className="w-full mt-4 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 text-sm font-light"
                    onClick={() => openManageUserModal(user)}
                  >
                    Manage User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 flex items-center justify-center gap-2">
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      {/* Manage User Modal */}
      {selectedUser && (
        <Dialog open={isManageUserModalOpen} onOpenChange={setIsManageUserModalOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light text-slate-900">
                Manage {selectedUser.firstName} {selectedUser.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="manage-role" className="text-sm font-light text-slate-700">
                  Role
                </Label>
                <Select
                  value={manageUserRole}
                  onValueChange={(value: "admin" | "member") => setManageUserRole(value)}
                  disabled={manageUserLoading}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manage-status" className="text-sm font-light text-slate-700">
                  Status
                </Label>
                <Select
                  value={manageUserStatus}
                  onValueChange={(value: "Active" | "Inactive") => setManageUserStatus(value)}
                  disabled={manageUserLoading}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between gap-3 mt-4">
              <Button variant="destructive" onClick={handleDeleteUser} disabled={manageUserLoading} className="rounded-xl flex-1">
                {manageUserLoading ? "Deleting..." : "Delete User"}
              </Button>
              <Button onClick={handleManageUserSubmit} disabled={manageUserLoading} className="rounded-xl bg-slate-900 hover:bg-slate-800 flex-1">
                {manageUserLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
