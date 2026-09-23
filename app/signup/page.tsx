// "use client"

// import React, { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { MessageSquare, Upload, Building, CheckCircle } from "lucide-react"
// import { useAuth } from "@/components/auth-provider"
// import PhoneInput from "react-phone-input-2";
// import "react-phone-input-2/lib/style.css";


// const countries = [
//   "Afghanistan",
//   "Albania",
//   "Algeria",
//   "Andorra",
//   "Angola",
//   "Antigua and Barbuda",
//   "Argentina",
//   "Armenia",
//   "Australia",
//   "Austria",
//   "Azerbaijan",
//   "Bahamas",
//   "Bahrain",
//   "Bangladesh",
//   "Barbados",
//   "Belarus",
//   "Belgium",
//   "Belize",
//   "Benin",
//   "Bhutan",
//   "Bolivia",
//   "Bosnia and Herzegovina",
//   "Botswana",
//   "Brazil",
//   "Brunei",
//   "Bulgaria",
//   "Burkina Faso",
//   "Burundi",
//   "Cabo Verde",
//   "Cambodia",
//   "Cameroon",
//   "Canada",
//   "Central African Republic",
//   "Chad",
//   "Chile",
//   "China",
//   "Colombia",
//   "Comoros",
//   "Congo",
//   "Costa Rica",
//   "Croatia",
//   "Cuba",
//   "Cyprus",
//   "Czech Republic",
//   "Denmark",
//   "Djibouti",
//   "Dominica",
//   "Dominican Republic",
//   "Ecuador",
//   "Egypt",
//   "El Salvador",
//   "Equatorial Guinea",
//   "Eritrea",
//   "Estonia",
//   "Eswatini",
//   "Ethiopia",
//   "Fiji",
//   "Finland",
//   "France",
//   "Gabon",
//   "Gambia",
//   "Georgia",
//   "Germany",
//   "Ghana",
//   "Greece",
//   "Grenada",
//   "Guatemala",
//   "Guinea",
//   "Guinea-Bissau",
//   "Guyana",
//   "Haiti",
//   "Honduras",
//   "Hungary",
//   "Iceland",
//   "India",
//   "Indonesia",
//   "Iran",
//   "Iraq",
//   "Ireland",
//   "Israel",
//   "Italy",
//   "Jamaica",
//   "Japan",
//   "Jordan",
//   "Kazakhstan",
//   "Kenya",
//   "Kiribati",
//   "Kuwait",
//   "Kyrgyzstan",
//   "Laos",
//   "Latvia",
//   "Lebanon",
//   "Lesotho",
//   "Liberia",
//   "Libya",
//   "Liechtenstein",
//   "Lithuania",
//   "Luxembourg",
//   "Madagascar",
//   "Malawi",
//   "Malaysia",
//   "Maldives",
//   "Mali",
//   "Malta",
//   "Marshall Islands",
//   "Mauritania",
//   "Mauritius",
//   "Mexico",
//   "Micronesia",
//   "Moldova",
//   "Monaco",
//   "Mongolia",
//   "Montenegro",
//   "Morocco",
//   "Mozambique",
//   "Myanmar",
//   "Namibia",
//   "Nauru",
//   "Nepal",
//   "Netherlands",
//   "New Zealand",
//   "Nicaragua",
//   "Niger",
//   "Nigeria",
//   "North Korea",
//   "North Macedonia",
//   "Norway",
//   "Oman",
//   "Pakistan",
//   "Palau",
//   "Palestine",
//   "Panama",
//   "Papua New Guinea",
//   "Paraguay",
//   "Peru",
//   "Philippines",
//   "Poland",
//   "Portugal",
//   "Qatar",
//   "Romania",
//   "Russia",
//   "Rwanda",
//   "Saint Kitts and Nevis",
//   "Saint Lucia",
//   "Saint Vincent and the Grenadines",
//   "Samoa",
//   "San Marino",
//   "Sao Tome and Principe",
//   "Saudi Arabia",
//   "Senegal",
//   "Serbia",
//   "Seychelles",
//   "Sierra Leone",
//   "Singapore",
//   "Slovakia",
//   "Slovenia",
//   "Solomon Islands",
//   "Somalia",
//   "South Africa",
//   "South Korea",
//   "South Sudan",
//   "Spain",
//   "Sri Lanka",
//   "Sudan",
//   "Suriname",
//   "Sweden",
//   "Switzerland",
//   "Syria",
//   "Taiwan",
//   "Tajikistan",
//   "Tanzania",
//   "Thailand",
//   "Timor-Leste",
//   "Togo",
//   "Tonga",
//   "Trinidad and Tobago",
//   "Tunisia",
//   "Turkey",
//   "Turkmenistan",
//   "Tuvalu",
//   "Uganda",
//   "Ukraine",
//   "United Arab Emirates",
//   "United Kingdom",
//   "United States",
//   "Uruguay",
//   "Uzbekistan",
//   "Vanuatu",
//   "Vatican City",
//   "Venezuela",
//   "Vietnam",
//   "Yemen",
//   "Zambia",
//   "Zimbabwe",
// ]

// const industries = [
//   "Technology",
//   "Healthcare",
//   "Finance",
//   "Education",
//   "Retail",
//   "Manufacturing",
//   "Real Estate",
//   "Automotive",
//   "Food & Beverage",
//   "Travel & Tourism",
//   "Media & Entertainment",
//   "Telecommunications",
//   "Energy",
//   "Construction",
//   "Agriculture",
//   "Transportation",
//   "Legal Services",
//   "Consulting",
//   "Marketing & Advertising",
//   "Non-profit",
//   "Government",
//   "Insurance",
//   "Banking",
//   "E-commerce",
//   "Software Development",
//   "Biotechnology",
//   "Pharmaceuticals",
//   "Fashion",
//   "Sports & Recreation",
//   "Beauty & Cosmetics",
//   "Gaming",
//   "Aerospace",
//   "Mining",
//   "Logistics",
//   "Security",
//   "Environmental Services",
//   "Architecture",
//   "Interior Design",
//   "Photography",
//   "Music",
//   "Art & Design",
//   "Publishing",
//   "Research & Development",
//   "Human Resources",
//   "Customer Service",
//   "Sales",
//   "Operations",
//   "Supply Chain",
//   "Quality Assurance",
//   "Data Analytics",
// ]

// const companySizes = [
//   { value: "1-10", label: "1-10 employees" },
//   { value: "11-50", label: "11-50 employees" },
//   { value: "51-100", label: "51-100 employees" },
//   { value: "101-500", label: "101-500 employees" },
//   { value: "500+", label: "500+ employees" },
// ]

// const plans = [
//   { value: "basic", label: "Basic Plan - $29/month", description: "Perfect for small teams" },
//   { value: "premium", label: "Premium Plan - $79/month", description: "Great for growing businesses" },
//   { value: "enterprise", label: "Enterprise Plan - $199/month", description: "For large organizations" },
//   { value: "custom", label: "Custom Plan - Contact us", description: "Tailored to your needs" },
// ]



// export default function SignupPage() {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     website: "",
//     description: "",
//     country: "",
//     city: "",
//     postalCode: "",
//     address: "",
//     industry: "",
//     companySize: "",
//     companySince: "",
//     plan: "",
//     logo: null as File | null,
//     password: "",
//     confirmPassword: "",
//   })
//   const [isLoading, setIsLoading] = useState(false)
//   const [showSuccess, setShowSuccess] = useState(false)
//   const [errors, setErrors] = useState<Record<string, string>>({})
//   const [errorMessage, setErrorMessage] = useState<string | null>(null);
//   const router = useRouter()
//   const { login } = useAuth()

//   useEffect(() => {
//   if (errorMessage) {
//     const timer = setTimeout(() => setErrorMessage(null), 5000); // 5 seconds
//     return () => clearTimeout(timer);
//   }
// }, [errorMessage]);


//   const validateEmail = (email: string) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//     return emailRegex.test(email)
//   }

//   const validatePhone = (phone: string) => {
//     const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
//     return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
//   }

//   const validateWebsite = (website: string) => {
//    const regex = /^www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
//     return regex.test(website);
//   }

//   const validatePassword = (password: string) => {
//     const minLength = password.length >= 8
//     const hasUppercase = /[A-Z]/.test(password)
//     const hasDigit = /[0-9]/.test(password)
//     return minLength && hasUppercase && hasDigit
//   }


//   const handleInputChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }))

//     // Clear error when user starts typing
//     if (errors[field]) {
//       setErrors((prev) => ({ ...prev, [field]: "" }))
//     }

//     // Real-time validation
//     if (field === "email" && value && !validateEmail(value)) {
//       setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }))
//     }
//     if (field === "phone" && value && !validatePhone(value)) {
//       setErrors((prev) => ({ ...prev, phone: "Please enter a valid phone number" }))
//     }
//     if (field === "website" && value && !validateWebsite(value)) {
//       setErrors((prev) => ({ ...prev, website: "Please enter a valid website URL" }))
//     }
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         // 5MB limit
//         setErrors((prev) => ({ ...prev, logo: "File size must be less than 5MB" }))
//         return
//       }
//       if (!file.type.startsWith("image/")) {
//         setErrors((prev) => ({ ...prev, logo: "Please upload an image file" }))
//         return
//       }
//       setFormData((prev) => ({ ...prev, logo: file }))
//       setErrors((prev) => ({ ...prev, logo: "" }))
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     // Validation
//     const newErrors: Record<string, string> = {}

//     if (!formData.name.trim()) newErrors.name = "Company name is required"
//     if (!formData.email.trim()) newErrors.email = "Email is required"
//     else if (!validateEmail(formData.email)) newErrors.email = "Please enter a valid email"
//     if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
//     else if (!validatePhone(formData.phone)) newErrors.phone = "Please enter a valid phone number"
//     if (formData.website && !validateWebsite(formData.website)) newErrors.website = "Please enter a valid website URL"
//     if (!formData.description.trim()) newErrors.description = "Company description is required"
//     if (!formData.country.trim()) newErrors.country = "Country is required"
//     if (!formData.city.trim()) newErrors.city = "City is required"
//     if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required"
//     if (!formData.address.trim()) newErrors.address = "Address is required"
//     if (!formData.industry) newErrors.industry = "Industry is required"
//     if (!formData.companySize) newErrors.companySize = "Company size is required"
//     if (!formData.companySince) newErrors.companySince = "Company founding year is required"
//     else if (Number.parseInt(formData.companySince) > new Date().getFullYear()) {
//       newErrors.companySince = "Founding year cannot be in the future"
//     }
//     // if (!formData.plan) newErrors.plan = "Please select a plan"

//     if (!formData.password) {
//       newErrors.password = "Password is required"
//     } else if (!validatePassword(formData.password)) {
//       newErrors.password = "Password must be at least 8 characters, include an uppercase letter and a digit"
//     }

//     if (formData.confirmPassword !== formData.password) {
//       newErrors.confirmPassword = "Passwords do not match"
//     }


//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors)
//       return
//     }

//     setIsLoading(true)

//     // Prepare data for backend
//     const signupData = {
//       name: formData.name,
//       email: formData.email,
//       phone: formData.phone,
//       website: formData.website || null,
//       description: formData.description,
//       address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
//       industry: formData.industry,
//       company_size: formData.companySize,
//       company_since: Number.parseInt(formData.companySince),
//       plan: null,
//       // formData.plan || 
//       logo: formData.logo,
//       // Default values (not shown in form)
//       status: "Pending",
//       last_login: null,
//       users: [],
//       monthly_usage: 0,
//       created_at: null,
//       updated_at: null,
//     }

//     try {
//       const body = new FormData()

//       // Append all values from signupData
//       body.append("name", formData.name)
//       body.append("email", formData.email)
//       body.append("phone", formData.phone)
//       body.append("website", formData.website || "")
//       body.append("description", formData.description)
//       body.append("address", `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`)
//       body.append("industry", formData.industry)
//       body.append("company_size", formData.companySize)
//       body.append("company_since", String(Number.parseInt(formData.companySince)))
//       body.append("plan", "Basic")
//       body.append("password", formData.password)
//       body.append("confirm_password", formData.confirmPassword)

//       // Add fields not shown in form but required in signupData
//       // body.append("status", "Pending")
//       // body.append("last_login", "") // send empty string or backend can default null
//       // body.append("users", JSON.stringify([])) // empty user array
//       // body.append("monthly_usage", "0")
//       // body.append("created_at", "") // let backend assign if needed
//       // body.append("updated_at", "")

//       // Append file
//       if (formData.logo) {
//         body.append("logo", formData.logo)
//       }
//       console.log(body.get("name"))
//       console.log(body.get("email"))
//       console.log(body.get("phone"))
//       console.log(body.get("website"))
//       console.log(body.get("description"))
//       console.log(body.get("address"))
//       console.log(body.get("industry"))
//       console.log(body.get("company_size"))
//       console.log(body.get("company_since"))
//       console.log(body.get("password"))

//       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/`, {
//         method: "POST",
//         body,
//       })

//       if (!response.ok) {
//         const errorData = await response.json();

//         // Convert errorData to string (handle objects like { email: ["This field is required."] })
//         const formattedError = Object.entries(errorData)
//           .map(([key, val]) => `${key}: ${(val as string[]).join(', ')}`)
//           .join('\n');

//         setErrorMessage(formattedError);
//         setIsLoading(false);
//         return;

//       }

//       setIsLoading(false)
//       setShowSuccess(true)

//       setTimeout(() => {
//         router.push("/login")
//       }, 5000)
//     } catch (err) {
//       console.error("Error submitting form:", err)
//       alert("Error submitting the form. Please try again.")
//       setIsLoading(false)
//     }

//   }

//   if (showSuccess) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
//         <Card className="w-full max-w-md shadow-xl border-0">
//           <CardContent className="p-8 text-center">
//             <div className="flex justify-center mb-6">
//               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
//                 <CheckCircle className="w-8 h-8 text-green-600" />
//               </div>
//             </div>
//             <h2 className="text-2xl font-bold text-slate-800 mb-4">Request Submitted!</h2>
//             <p className="text-slate-600 mb-6">
//               Your company registration request is being processed. You will receive an email confirmation shortly.
//             </p>
//             <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
//               <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
//               <span>Redirecting to login page...</span>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
//       <Card className="w-full max-w-2xl shadow-xl border-0">
//         <CardHeader className="space-y-4 text-center">
//           <div className="flex items-center justify-center space-x-2">
//             <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
//               <MessageSquare className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-2xl font-bold text-slate-800">Smart Convo</span>
//           </div>
//           <div>
//             <CardTitle className="text-2xl text-slate-800 flex items-center justify-center gap-2">
//               <Building className="w-6 h-6" />
//               Create Company Account
//             </CardTitle>
//             <CardDescription className="text-slate-600">
//               Register your company to get started with Smart Convo
//             </CardDescription>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Basic Information */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Basic Information</h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="name" className="text-slate-700">
//                     Company Name *
//                   </Label>
//                   <Input
//                     id="name"
//                     placeholder="Enter company name"
//                     value={formData.name}
//                     onChange={(e) => handleInputChange("name", e.target.value)}
//                     className={`h-11 transition-all duration-200 ${errors.name ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                   />
//                   {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="email" className="text-slate-700">
//                     Company Email *
//                   </Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder="company@example.com"
//                     value={formData.email}
//                     onChange={(e) => handleInputChange("email", e.target.value)}
//                     className={`h-11 transition-all duration-200 ${errors.email ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                   />
//                   {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="phone" className="text-slate-700">
//                     Phone Number *
//                   </Label>
//                   <PhoneInput
//                     country={'us'}
//                     value={formData.phone}
//                     onChange={(phone) => handleInputChange("phone", phone)}
//                     inputProps={{
//                       name: 'phone',
//                       required: true,
//                       className: `h-11 w-full border px-3 py-2 rounded-md focus:outline-none transition-all duration-200 ${
//                         errors.phone ? 'border-red-500 focus:border-red-500' : 'focus:border-teal-500'
//                       }`,
//                     }}
//                     containerClass="w-full"
//                   />
//                   {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="website" className="text-slate-700">
//                     Website
//                   </Label>
//                   <Input
//                     id="website"
//                     placeholder="www.company.com"
//                     value={formData.website}
//                     onChange={(e) => handleInputChange("website", e.target.value)}
//                     className={`h-11 transition-all duration-200 ${errors.website ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                   />
//                   {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="description" className="text-slate-700">
//                   Company Description *
//                 </Label>
//                 <Textarea
//                   id="description"
//                   placeholder="Tell us about your company..."
//                   value={formData.description}
//                   onChange={(e) => handleInputChange("description", e.target.value)}
//                   className={`min-h-[100px] transition-all duration-200 ${errors.description ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                 />
//                 {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="password" className="text-slate-700">
//                   Password *
//                 </Label>
//                 <Input
//                   id="password"
//                   type="password"
//                   placeholder="Enter a strong password"
//                   value={formData.password}
//                   onChange={(e) => handleInputChange("password", e.target.value)}
//                   className={`h-11 transition-all duration-200 ${errors.password ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                 />
//                 {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="confirmPassword" className="text-slate-700">
//                   Confirm Password *
//                 </Label>
//                 <Input
//                   id="confirmPassword"
//                   type="password"
//                   placeholder="Re-enter password"
//                   value={formData.confirmPassword}
//                   onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
//                   className={`h-11 transition-all duration-200 ${errors.confirmPassword ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                 />
//                 {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
//               </div>
//             </div>

//             {/* Address Information */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Address Information</h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="country" className="text-slate-700">
//                     Country *
//                   </Label>
//                   <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
//                     <SelectTrigger
//                       className={`h-11 transition-all duration-200 ${errors.country ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                     >
//                       <SelectValue placeholder="Select country" />
//                     </SelectTrigger>
//                     <SelectContent className="max-h-60">
//                       {countries.map((country) => (
//                         <SelectItem key={country} value={country}>
//                           {country}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="city" className="text-slate-700">
//                     City *
//                   </Label>
//                   <Input
//                     id="city"
//                     placeholder="New York"
//                     value={formData.city}
//                     onChange={(e) => handleInputChange("city", e.target.value)}
//                     className={`h-11 transition-all duration-200 ${errors.city ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                   />
//                   {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="postalCode" className="text-slate-700">
//                     Postal Code *
//                   </Label>
//                   <Input
//                     id="postalCode"
//                     placeholder="10001"
//                     value={formData.postalCode}
//                     onChange={(e) => handleInputChange("postalCode", e.target.value)}
//                     className={`h-11 transition-all duration-200 ${errors.postalCode ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                   />
//                   {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="address" className="text-slate-700">
//                     Street Address *
//                   </Label>
//                   <Input
//                     id="address"
//                     placeholder="123 Main Street"
//                     value={formData.address}
//                     onChange={(e) => handleInputChange("address", e.target.value)}
//                     className={`h-11 transition-all duration-200 ${errors.address ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                   />
//                   {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
//                 </div>
//               </div>
//             </div>

//             {/* Company Details */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Company Details</h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="industry" className="text-slate-700">
//                     Industry *
//                   </Label>
//                   <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
//                     <SelectTrigger
//                       className={`h-11 transition-all duration-200 ${errors.industry ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                     >
//                       <SelectValue placeholder="Select industry" />
//                     </SelectTrigger>
//                     <SelectContent className="max-h-60">
//                       {industries.map((industry) => (
//                         <SelectItem key={industry} value={industry}>
//                           {industry}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   {errors.industry && <p className="text-sm text-red-500">{errors.industry}</p>}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="companySize" className="text-slate-700">
//                     Company Size *
//                   </Label>
//                   <Select
//                     value={formData.companySize}
//                     onValueChange={(value) => handleInputChange("companySize", value)}
//                   >
//                     <SelectTrigger
//                       className={`h-11 transition-all duration-200 ${errors.companySize ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                     >
//                       <SelectValue placeholder="Select company size" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {companySizes.map((size) => (
//                         <SelectItem key={size.value} value={size.value}>
//                           {size.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   {errors.companySize && <p className="text-sm text-red-500">{errors.companySize}</p>}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="companySince" className="text-slate-700">
//                     Company Since *
//                   </Label>
//                   <Input
//                     id="companySince"
//                     type="number"
//                     min="1800"
//                     max={new Date().getFullYear()}
//                     placeholder="2020"
//                     value={formData.companySince}
//                     onChange={(e) => handleInputChange("companySince", e.target.value)}
//                     className={`h-11 transition-all duration-200 ${errors.companySince ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                   />
//                   {errors.companySince && <p className="text-sm text-red-500">{errors.companySince}</p>}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="logo" className="text-slate-700">
//                     Company Logo
//                   </Label>
//                   <div className="relative">
//                     <Input id="logo" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
//                     <Button
//                       type="button"
//                       variant="outline"
//                       className="w-full h-11 justify-start bg-transparent"
//                       onClick={() => document.getElementById("logo")?.click()}
//                     >
//                       <Upload className="w-4 h-4 mr-2" />
//                       {formData.logo ? formData.logo.name : "Upload logo"}
//                     </Button>
//                   </div>
//                   {errors.logo && <p className="text-sm text-red-500">{errors.logo}</p>}
//                 </div>
//               </div>
//             </div>

//             {/* Plan Selection */}
//             {/* <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Select Plan</h3>

//               <div className="space-y-2">
//                 <Label htmlFor="plan" className="text-slate-700">
//                   Choose Your Plan *
//                 </Label>
//                 <Select value={formData.plan} onValueChange={(value) => handleInputChange("plan", value)}>
//                   <SelectTrigger
//                     className={`h-11 transition-all duration-200 ${errors.plan ? "border-red-500 focus:border-red-500" : "focus:border-teal-500"}`}
//                   >
//                     <SelectValue placeholder="Select a plan" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {plans.map((plan) => (
//                       <SelectItem key={plan.value} value={plan.value}>
//                         <div className="flex flex-col">
//                           <span className="font-medium">{plan.label}</span>
//                           <span className="text-sm text-slate-500">{plan.description}</span>
//                         </div>
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 {errors.plan && <p className="text-sm text-red-500">{errors.plan}</p>}
//               </div>
//             </div> */}

//             <Button
//               type="submit"
//               className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white text-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <div className="flex items-center space-x-2">
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   <span>Creating Account...</span>
//                 </div>
//               ) : (
//                 "Create Company Account"
//               )}
//             </Button>
//           </form>

//           {errorMessage && (
//             <div className="mt-4 p-2 text-sm text-red-600 bg-red-100 rounded">
//               {errorMessage}
//             </div>
//           )}


//           <div className="mt-6 text-center">
//             <p className="text-sm text-slate-600">
//               Already have an account?{" "}
//               <Link
//                 href="/login"
//                 className="text-teal-600 hover:text-teal-700 font-medium transition-colors duration-200"
//               >
//                 Sign in
//               </Link>
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }




"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { useToast } from "@/hooks/use-toast"


const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
]

const industries = [
  "Aerospace",
  "Agriculture",
  "Architecture",
  "Art & Design",
  "Automotive",
  "Banking",
  "Beauty & Cosmetics",
  "Biotechnology",
  "Chemicals",
  "Childcare Services",
  "Construction",
  "Consulting",
  "Customer Service",
  "Data Analytics",
  "E-commerce",
  "Education",
  "Electronics",
  "Energy",
  "Environmental Services",
  "Event Management",
  "Fashion",
  "Film & Television",
  "Finance",
  "Fitness & Sports",
  "Food & Beverage",
  "Food Production",
  "Furniture",
  "Gaming",
  "Government",
  "Health & Wellness",
  "Healthcare",
  "Hospitality",
  "Human Resources",
  "Insurance",
  "Interior Design",
  "Legal Services",
  "Logistics",
  "Manufacturing",
  "Marketing & Advertising",
  "Media & Entertainment",
  "Mining",
  "Music",
  "Music & Audio",
  "Municipal Services",
  "Non-profit",
  "Operations",
  "Pharmaceuticals",
  "Photography",
  "Printing & Packaging",
  "Public Relations",
  "Publishing",
  "Quality Assurance",
  "Real Estate",
  "Recruitment",
  "Research & Development",
  "Restaurant",
  "Retail",
  "Sales",
  "Security",
  "Software Development",
  "Sports & Recreation",
  "Supply Chain",
  "Technology",
  "Telecommunications",
  "Textile",
  "Tourism",
  "Training & Development",
  "Transportation",
  "Travel & Tourism",
  "Waste Management",
  "Wellness & Spa",
  "Other"
];


const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-100", label: "51-100 employees" },
  { value: "101-500", label: "101-500 employees" },
  { value: "500+", label: "500+ employees" },
]

const plans = [
  { value: "basic", label: "Basic Plan - $29/month", description: "Perfect for small teams" },
  { value: "premium", label: "Premium Plan - $79/month", description: "Great for growing businesses" },
  { value: "enterprise", label: "Enterprise Plan - $199/month", description: "For large organizations" },
  { value: "custom", label: "Custom Plan - Contact us", description: "Tailored to your needs" },
]

/** API field errors may be string[], a single string, or nested objects (e.g. DRF). */
function formatApiFieldError(val: unknown): string {
  if (Array.isArray(val)) return val.map((v) => String(v)).join(", ")
  if (val != null && typeof val === "object") return JSON.stringify(val)
  return String(val ?? "")
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    country: "",
    city: "",
    postalCode: "",
    address: "",
    industry: "",
    companySize: "",
    companySince: "",
    plan: "",
    logo: null as File | null,
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
  }

  const validateWebsite = (website: string) => {
    const regex = /^www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/
    return regex.test(website)
  }

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasDigit = /[0-9]/.test(password)
    return minLength && hasUppercase && hasDigit
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Real-time validation
    if (field === "email" && value && !validateEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }))
    }
    if (field === "phone" && value && !validatePhone(value)) {
      setErrors((prev) => ({ ...prev, phone: "Please enter a valid phone number" }))
    }
    if (field === "website" && value && !validateWebsite(value)) {
      setErrors((prev) => ({ ...prev, website: "Please enter a valid website URL" }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({ ...prev, logo: "File size must be less than 5MB" }))
        return
      }
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, logo: "Please upload an image file" }))
        return
      }
      setFormData((prev) => ({ ...prev, logo: file }))
      setErrors((prev) => ({ ...prev, logo: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Company name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!validateEmail(formData.email)) newErrors.email = "Please enter a valid email"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    else if (!validatePhone(formData.phone)) newErrors.phone = "Please enter a valid phone number"
    if (!formData.website.trim()) newErrors.website = "Website is required"
    else if (!validateWebsite(formData.website)) newErrors.website = "Please enter a valid website URL"
    if (formData.website && !validateWebsite(formData.website)) newErrors.website = "Please enter a valid website URL"
    if (!formData.description.trim()) newErrors.description = "Company description is required"
    if (!formData.country.trim()) newErrors.country = "Country is required"
    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required"
    else if (!/^\d+$/.test(formData.postalCode)) newErrors.postalCode = "Postal code must be a number"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.industry) newErrors.industry = "Industry is required"
    if (!formData.companySize) newErrors.companySize = "Company size is required"
    if (!formData.companySince) newErrors.companySince = "Company founding year is required"
    else if (Number.parseInt(formData.companySince) > new Date().getFullYear()) {
      newErrors.companySince = "Founding year cannot be in the future"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters, include an uppercase letter and a digit"
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Prepare data for backend
    const signupData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      website: formData.website || null,
      description: formData.description,
      address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
      industry: formData.industry,
      company_size: formData.companySize,
      company_since: Number.parseInt(formData.companySince),
      plan: null,
      logo: formData.logo,
      status: "Pending",
      last_login: null,
      users: [],
      monthly_usage: 0,
      created_at: null,
      updated_at: null,
    }

    try {
      const body = new FormData()

      // Append all values from signupData
      body.append("name", formData.name)
      body.append("email", formData.email)
      body.append("phone", formData.phone)
      body.append("website", formData.website || "")
      body.append("description", formData.description)
      body.append("address", `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`)
      body.append("industry", formData.industry)
      body.append("company_size", formData.companySize)
      body.append("company_since", String(Number.parseInt(formData.companySince)))
      body.append("plan", "Basic")
      body.append("password", formData.password)
      body.append("confirm_password", formData.confirmPassword)

      // Append file
      if (formData.logo) {
        body.append("logo", formData.logo)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/companies/`, {
        method: "POST",
        body,
      })

      if (!response.ok) {
        const errorData = (await response.json()) as Record<string, unknown>

        const formattedError = Object.entries(errorData)
          .map(([key, val]) => `${key}: ${formatApiFieldError(val)}`)
          .join("\n")

        setErrorMessage(formattedError)
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setShowSuccess(true)

      setTimeout(() => {
        router.push("/login")
      }, 5000)
    } catch (err) {
      console.error("Error submitting form:", err)
      alert("Error submitting the form. Please try again.")
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    const stepErrors: Record<string, string> = {}
    if (currentStep === 1) {
      if (!formData.name.trim()) stepErrors.name = "Company name is required"
      if (!formData.email.trim()) stepErrors.email = "Email is required"
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) stepErrors.email = "Please enter a valid email"
      if (!formData.phone.trim()) stepErrors.phone = "Phone number is required"
    }
    if (currentStep === 2) {
      if (!formData.description.trim()) stepErrors.description = "Description is required"
      if (!formData.industry) stepErrors.industry = "Industry is required"
      if (!formData.companySize) stepErrors.companySize = "Company size is required"
      if (!formData.companySince) stepErrors.companySince = "Founded year is required"
    }
    if (currentStep === 3) {
      if (!formData.country.trim()) stepErrors.country = "Country is required"
      if (!formData.city.trim()) stepErrors.city = "City is required"
      if (!formData.postalCode.trim()) stepErrors.postalCode = "Postal code is required"
      if (!formData.address.trim()) stepErrors.address = "Address is required"
    }
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setCurrentStep((prev) => prev + 1)
  }

    if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#050f0a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-8" style={{ backgroundImage: 'url("/agent-bg.jpg")' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/[0.05] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md px-6">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-xl">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-light text-white mb-3 tracking-tight">You're in.</h2>
          <p className="text-slate-400 font-light leading-relaxed mb-8">
            Your company registration is under review. We'll send a confirmation to your email shortly.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    )
  }

  const stepTitles = ["Company Identity", "Business Profile", "Location", "Security"]
  const stepSubtitles = ["Tell us who you are", "What does your company do?", "Where are you based?", "Secure your account"]

  return (
    <div className="min-h-screen bg-[#050f0a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-8"
          style={{ backgroundImage: 'url("/agent-bg.jpg")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050f0a] via-transparent to-[#050f0a]" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-teal-400/[0.03] rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between p-14 w-[42%]">
          <div className="flex items-center gap-3">
            <Image src="/Logo.png" alt="SmartConvo" width={46} height={46} className="rounded-xl" />
            <span className="text-white font-semibold text-xl tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>SmartConvo</span>
          </div>

          <div>
            <p className="text-emerald-400 text-xs font-medium tracking-[0.2em] uppercase mb-6">Pentagon AI</p>
            <h1 className="text-[3rem] font-extralight text-white leading-[1.15] tracking-tight mb-6">
              Register your<br />
              <span className="text-emerald-400 font-light">company</span> and<br />
              start automating<br />
              every call.
            </h1>
            <p className="text-slate-300 font-light text-base leading-relaxed max-w-sm">
              Join hundreds of businesses using SmartConvo to handle customer
              conversations automatically, 24/7.
            </p>
            <div className="flex flex-col gap-3 mt-10">
              {[
                "AI agents handle every inbound call",
                "Automated appointment booking",
                "Full conversation analytics & reporting",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                  <span className="text-slate-300 font-light text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-400 text-sm font-light">
            Already registered?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign in →
            </Link>
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-[540px] py-8">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <Image src="/Logo.png" alt="SmartConvo" width={40} height={40} className="rounded-xl" />
              <span className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>SmartConvo</span>
            </div>

            {/* Card */}
            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.4)]">

              {/* Step progress */}
              <div className="flex items-center mb-8">
                {[1, 2, 3, 4].map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    {i > 0 && (
                      <div className={`flex-1 h-[1px] transition-all duration-500 ${step <= currentStep ? "bg-emerald-400/70" : "bg-white/10"}`} />
                    )}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-all duration-300 shrink-0 ${
                        step < currentStep
                          ? "bg-emerald-400 text-[#050f0a]"
                          : step === currentStep
                          ? "border border-emerald-400 text-emerald-400 bg-emerald-400/10"
                          : "border border-white/10 text-slate-600"
                      }`}
                    >
                      {step < currentStep ? "✓" : step}
                    </div>
                    {i < 3 && (
                      <div className={`flex-1 h-[1px] transition-all duration-500 ${step < currentStep ? "bg-emerald-400/70" : "bg-white/10"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step header */}
              <div className="mb-7">
                <h2 className="text-2xl font-light text-white tracking-tight">{stepTitles[currentStep - 1]}</h2>
                <p className="text-slate-400 text-sm mt-1 font-light">{stepSubtitles[currentStep - 1]}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-0">

                {/* STEP 1: Company Identity */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Company Name *</Label>
                        <Input
                          placeholder="Acme Corporation"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.name ? "border-red-500/50" : ""}`}
                        />
                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Company Email *</Label>
                        <Input
                          type="email"
                          placeholder="hello@company.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.email ? "border-red-500/50" : ""}`}
                        />
                        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Website</Label>
                        <Input
                          placeholder="www.company.com"
                          value={formData.website}
                          onChange={(e) => handleInputChange("website", e.target.value)}
                          className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.website ? "border-red-500/50" : ""}`}
                        />
                        {errors.website && <p className="text-xs text-red-400 mt-1">{errors.website}</p>}
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Phone Number *</Label>
                        <PhoneInput
                          country={"us"}
                          value={formData.phone}
                          onChange={(phone) => handleInputChange("phone", phone)}
                          inputProps={{ name: "phone", required: true }}
                          inputStyle={{
                            width: "100%",
                            height: "44px",
                            background: "rgba(255,255,255,0.05)",
                            border: errors.phone ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            color: "white",
                            fontSize: "14px",
                            paddingLeft: "52px",
                          }}
                          buttonStyle={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRight: "none",
                            borderRadius: "12px 0 0 12px",
                          }}
                          dropdownStyle={{
                            background: "#0d1f16",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            color: "white",
                          }}
                        />
                        {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Business Profile */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                    <div className="space-y-1.5">
                      <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Company Description *</Label>
                      <Textarea
                        placeholder="Tell us what your company does, who your customers are..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        className={`min-h-[90px] bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors resize-none ${errors.description ? "border-red-500/50" : ""}`}
                      />
                      {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Industry *</Label>
                        <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                          <SelectTrigger className={`h-11 bg-white/[0.05] border-white/[0.08] text-white rounded-xl focus:ring-0 focus:border-emerald-400/50 ${errors.industry ? "border-red-500/50" : ""}`}>
                            <SelectValue placeholder="Select your industry" className="text-slate-700" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1f16] border-white/10 max-h-60 rounded-xl">
                            {industries.map((industry) => (
                              <SelectItem key={industry} value={industry} className="text-slate-300 focus:bg-emerald-400/10 focus:text-emerald-300">{industry}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.industry && <p className="text-xs text-red-400 mt-1">{errors.industry}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Company Size *</Label>
                        <Select value={formData.companySize} onValueChange={(value) => handleInputChange("companySize", value)}>
                          <SelectTrigger className={`h-11 bg-white/[0.05] border-white/[0.08] text-white rounded-xl focus:ring-0 ${errors.companySize ? "border-red-500/50" : ""}`}>
                            <SelectValue placeholder="Team size" className="text-slate-700" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1f16] border-white/10 rounded-xl">
                            {companySizes.map((size) => (
                              <SelectItem key={size.value} value={size.value} className="text-slate-300 focus:bg-emerald-400/10 focus:text-emerald-300">{size.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.companySize && <p className="text-xs text-red-400 mt-1">{errors.companySize}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Founded Year *</Label>
                        <Input
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                          placeholder="2020"
                          value={formData.companySince}
                          onChange={(e) => handleInputChange("companySince", e.target.value)}
                          className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.companySince ? "border-red-500/50" : ""}`}
                        />
                        {errors.companySince && <p className="text-xs text-red-400 mt-1">{errors.companySince}</p>}
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Company Logo</Label>
                        <Input id="logo" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        <button
                          type="button"
                          onClick={() => document.getElementById("logo")?.click()}
                          className="w-full h-11 flex items-center gap-3 px-4 bg-white/[0.05] border border-dashed border-white/[0.12] rounded-xl text-slate-500 hover:text-slate-300 hover:border-emerald-400/30 hover:bg-white/[0.07] transition-all text-sm"
                        >
                          <Upload className="w-4 h-4 shrink-0" />
                          {formData.logo ? formData.logo.name : "Upload company logo (optional)"}
                        </button>
                        {errors.logo && <p className="text-xs text-red-400 mt-1">{errors.logo}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Location */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Country *</Label>
                        <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                          <SelectTrigger className={`h-11 bg-white/[0.05] border-white/[0.08] text-white rounded-xl focus:ring-0 ${errors.country ? "border-red-500/50" : ""}`}>
                            <SelectValue placeholder="Select country" className="text-slate-700" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1f16] border-white/10 max-h-60 rounded-xl">
                            {countries.map((country) => (
                              <SelectItem key={country} value={country} className="text-slate-300 focus:bg-emerald-400/10 focus:text-emerald-300">{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.country && <p className="text-xs text-red-400 mt-1">{errors.country}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">City *</Label>
                        <Input
                          placeholder="New York"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.city ? "border-red-500/50" : ""}`}
                        />
                        {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Postal Code *</Label>
                        <Input
                          placeholder="10001"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange("postalCode", e.target.value)}
                          className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.postalCode ? "border-red-500/50" : ""}`}
                        />
                        {errors.postalCode && <p className="text-xs text-red-400 mt-1">{errors.postalCode}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Street Address *</Label>
                        <Input
                          placeholder="123 Main Street"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.address ? "border-red-500/50" : ""}`}
                        />
                        {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Security */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                    <p className="text-slate-400 text-sm font-light">
                      Create a secure password for your SmartConvo account.
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min 8 chars, 1 uppercase, 1 digit"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.password ? "border-red-500/50" : ""}`}
                      />
                      {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-400 text-xs font-medium tracking-widest uppercase">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={`h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-0 focus-visible:border-emerald-400/50 transition-colors ${errors.confirmPassword ? "border-red-500/50" : ""}`}
                      />
                      {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {errorMessage && (
                  <div className="mt-4 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl whitespace-pre-line">
                    {errorMessage}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-7 mt-6 border-t border-white/[0.06]">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                      className="flex-1 h-11 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] rounded-xl text-sm transition-all duration-200"
                    >
                      Back
                    </button>
                  )}
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 text-[#050f0a] font-semibold rounded-xl text-sm transition-all duration-200"
                    >
                      Continue
                    </button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 text-[#050f0a] font-semibold rounded-xl transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#050f0a]/40 border-t-[#050f0a] rounded-full animate-spin" />
                          Creating account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  )}
                </div>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6 font-light">
                Already have an account?{" "}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}