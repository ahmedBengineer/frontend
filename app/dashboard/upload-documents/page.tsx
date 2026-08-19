// "use client"

// import { useRef, useState, useEffect } from "react"
// import Cookies from "js-cookie"

// export default function UploadDocumentsPage() {
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const [uploading, setUploading] = useState(false)
//   const [docs, setDocs] = useState<any[]>([])

//   const token = Cookies.get("Token") || ""

//   const handleUpload = async () => {
//     const file = fileInputRef.current?.files?.[0]
//     if (!file) return alert("Please select a file.")

//     setUploading(true)
//     alert(file.name + " " + file.type)

//     try {
//       // Get presigned S3 URL from backend
//       const presignedRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/s3/presigned-url/`, {
//         method: "POST",
//         headers: {
//           Authorization: `Token ${token}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           file_name: file.name,
//           content_type: file.type
//         })
//       })

//       const presignedData = await presignedRes.json()
//       const uploadUrl = presignedData.url

//       console.log("Uploading to S3 URL:", uploadUrl)
//       console.log("File details:", {
//         name: file.name,
//         type: file.type,
//         size: file.size
//         })


//       // Upload the file to S3 using the presigned URL
//       const s3Res = await fetch(uploadUrl, {
//         method: "PUT",
//         headers: {
//           "Content-Type": file.type
//         },
//         body: file
//       })

//       if (!s3Res.ok) {
//         const errText = await s3Res.text()
//         console.error("S3 Upload failed:", errText)
//         throw new Error("S3 Upload failed.")
//         }

//       // Step 3: Notify backend about the uploaded document
//       await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/`, {
//         method: "POST",
//         headers: {
//           Authorization: `Token ${token}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           title: file.name,
//           description: "Uploaded from web app",
//           s3_url: uploadUrl.split("?")[0]
//         })
//       })

//       alert("File uploaded successfully!")
//       fetchDocuments() // refresh list
//     } catch (error) {
//       console.error("Upload error:", error)
//       alert("Upload failed.")
//     } finally {
//       setUploading(false)
//     }
//   }

//   const fetchDocuments = async () => {
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/`, {
//         headers: {
//           Authorization: `Token ${token}`
//         }
//       })
//       const data = await res.json()
//       setDocs(data)
//     } catch (error) {
//       console.error("Failed to fetch documents:", error)
//     }
//   }

//   useEffect(() => {
//     fetchDocuments()
//   }, [])

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-bold">Upload Documents</h1>

//       {/* Upload Form */}
//       <div className="space-y-4">
//         <input type="file" ref={fileInputRef} className="block w-full" />
//         <button
//           onClick={handleUpload}
//           disabled={uploading}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           {uploading ? "Uploading..." : "Upload Document"}
//         </button>
//       </div>

//       {/* Document List */}
//       <div className="mt-6">
//         <h2 className="text-xl font-semibold mb-2">Uploaded Files</h2>
//         <ul className="space-y-2">
//           {docs.map((doc: any) => (
//             <li key={doc.id}>
//               <a
//                 href={doc.s3_url}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-600 underline"
//               >
//                 {doc.title}
//               </a>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   )
// }


// "use client"

// import { useRef, useState, useEffect } from "react"
// import Cookies from "js-cookie"
// import { UploadCloud, Loader2, FileText } from "lucide-react"

// export default function UploadDocumentsPage() {
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const [uploading, setUploading] = useState(false)
//   const [docs, setDocs] = useState<any[]>([])
//   const [successMessage, setSuccessMessage] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");


//   const token = Cookies.get("Token") || ""

//   const handleUpload = async () => {
//     const file = fileInputRef.current?.files?.[0]
//     if (!file) {
//         setErrorMessage("Please select a file.");
//         setTimeout(() => setErrorMessage(""), 5000);
//         return;
//     } 

//     setUploading(true)

//     try {
//       const presignedRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/s3/presigned-url/`, {
//         method: "POST",
//         headers: {
//           Authorization: `Token ${token}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           file_name: file.name,
//           content_type: file.type
//         })
//       })

//       const presignedData = await presignedRes.json()
//       const uploadUrl = presignedData.url

//       const s3Key = uploadUrl.split("?")[0].split("/").slice(3).join("/") // ✅ Extract the real key

//       const s3Res = await fetch(uploadUrl, {
//         method: "PUT",
//         headers: {
//           "Content-Type": file.type
//         },
//         body: file
//       })

//       if (!s3Res.ok) {
//         setErrorMessage("Upload failed.");
//         setTimeout(() => setErrorMessage(""), 5000);
//         throw new Error("S3 Upload failed.")
//       }

//       const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/`, {
//         method: "POST",
//         headers: {
//           Authorization: `Token ${token}`,
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           title: file.name,
//           description: "Uploaded from web app",
//           s3_url: uploadUrl.split("?")[0],
//           s3_key: s3Key 
//         })
//       })

//       const result = await response.json()
//     //   setSuccessMessage("File uploaded successfully!");
//     setSuccessMessage(result);
//       setTimeout(() => setSuccessMessage(""), 3000);

//       fetchDocuments()
//     } catch (error) {
//       setErrorMessage("Upload failed.");
//       setTimeout(() => setErrorMessage(""), 5000);
//     } finally {
//       setUploading(false)
//     }
//   }

//   const fetchDocuments = async () => {
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/`, {
//         headers: {
//           Authorization: `Token ${token}`
//         }
//       })
//       const data = await res.json()
//       setDocs(data)
//     } catch (error) {
//       console.error("Failed to fetch documents:", error)
//     }
//   }

//   useEffect(() => {
//     fetchDocuments()
//   }, [])

//   return (
//     <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-xl space-y-8 border border-gray-200">
//       <h1 className="text-3xl font-semibold text-gray-800">📁 Upload Documents</h1>

//       {successMessage && (
//         <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 shadow-sm animate-fade-in">
//             <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//             </svg>
//             <span className="font-medium">{successMessage}</span>
//         </div>
//         )}
    
//     {errorMessage && (
//         <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 shadow-sm animate-fade-in">
//             <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//             <span className="font-medium">{errorMessage}</span>
//         </div>
//         )}


//       {/* Upload Form */}
//       <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 text-center">
//         <input
//           type="file"
//           ref={fileInputRef}
//           className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//         />
//         <button
//           onClick={handleUpload}
//           disabled={uploading}
//           className={`inline-flex items-center px-5 py-2.5 rounded-lg text-white font-medium ${
//             uploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
//           } transition duration-200`}
//         >
//           {uploading ? (
//             <>
//               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//               Uploading...
//             </>
//           ) : (
//             <>
//               <UploadCloud className="w-4 h-4 mr-2" />
//               Upload Document
//             </>
//           )}
//         </button>
//       </div>

//       {/* Document List */}
//       <div>
//         <h2 className="text-2xl font-medium text-gray-800 mb-4">🗂 Uploaded Files</h2>
//         {docs.length === 0 ? (
//           <p className="text-gray-500">No documents uploaded yet.</p>
//         ) : (
//           <ul className="space-y-3">
//             {docs.map((doc: any) => {
//               return (
//                 <li
//                   key={doc.id}
//                   className="flex items-center space-x-3 text-blue-700 hover:underline"
//                 >
//                   <button
//                     onClick={async () => {
//                       try {
//                         const res = await fetch(
//                           `${process.env.NEXT_PUBLIC_BASE_URL}/documents/presigned-view-url/?file_key=${encodeURIComponent(doc.s3_key)}`,
//                           {
//                             headers: {
//                               Authorization: `Token ${token}`,
//                             },
//                           }
//                         )

//                         if (!res.ok) {
//                           throw new Error("Failed to get presigned URL")
//                         }

//                         const data = await res.json()
//                         const url = data.presigned_url
//                         window.open(url, "_blank") 
//                       } catch (err) {
//                         console.error(err)
//                         alert("Could not open the document.")
//                       }
//                     }}
//                     className="flex items-center space-x-2 text-blue-700 hover:underline"
//                   >
//                     <FileText className="w-5 h-5 text-blue-500" />
//                     <span>{doc.title || doc.s3_key}</span>
//                   </button>
//                 </li>
//               )
//             })}
//           </ul>
//         )}
//       </div>
//     </div>
//   )
// }


"use client"

import { useRef, useState, useEffect } from "react"
import Cookies from "js-cookie"
import { UploadCloud, Loader2, FileText } from "lucide-react"

export default function UploadDocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [docs, setDocs] = useState<any[]>([])
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");


  const token = Cookies.get("Token") || ""

 

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
        setErrorMessage("Please select a file.");
        setTimeout(() => setErrorMessage(""), 5000);
        return;
    } 

    setUploading(true)

    try {
      const presignedRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/s3/presigned-url/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type
        })
      })

      const presignedData = await presignedRes.json()
      const uploadUrl = presignedData.url

      console.log("Uploading to S3 URL:", uploadUrl)
      console.log("File details:", {
        name: file.name,
        type: file.type,
        size: file.size
      })

      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type
        },
        body: file
      })

      if (!s3Res.ok) {
        const errText = await s3Res.text()
        // console.error("S3 Upload failed:", errText)
        setErrorMessage("Upload failed.");
        setTimeout(() => setErrorMessage(""), 5000);
        throw new Error("S3 Upload failed.")
      }
        
      const s3Key = presignedData.file_key // ← Correct

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: file.name,
          description: "Uploaded from web app",
          s3_url: uploadUrl.split("?")[0],
          file_key: s3Key 
        })
      })

      const result = await response.json()
    //   setSuccessMessage("File uploaded successfully!");
      if (response.ok) {
        setSuccessMessage("File uploaded successfully!")
      } else {
        setErrorMessage("Upload metadata failed!")
        }
      setTimeout(() => setSuccessMessage(""), 3000);

      fetchDocuments()
    } catch (error) {
      // console.error("Upload error:", error)
      setErrorMessage("Upload failed.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setUploading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/documents/documents/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      })
      const data = await res.json()
      setDocs(data)

      
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-xl space-y-8 border border-gray-200">
      <h1 className="text-3xl font-semibold text-gray-800">📁 Upload Documents</h1>

      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 shadow-sm animate-fade-in">
            <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successMessage}</span>
        </div>
        )}
    
    {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 shadow-sm animate-fade-in">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">{errorMessage}</span>
        </div>
        )}


      {/* Upload Form */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 text-center">
        <input
          type="file"
          ref={fileInputRef}
          className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`inline-flex items-center px-5 py-2.5 rounded-lg text-white font-medium ${
            uploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          } transition duration-200`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload Document
            </>
          )}
        </button>
      </div>

      {/* Document List */}
      <div>
  <h2 className="text-2xl font-medium text-gray-800 mb-4">🗂 Uploaded Files</h2>
  {docs.length === 0 ? (
    <p className="text-gray-500">No documents uploaded yet.</p>
  ) : (
    <ul className="space-y-3">
      {docs.map((doc: any) => {
        const presignedUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/documents/presigned-view-url/?file_key=${encodeURIComponent(doc.title)}`

        return (
          <li
            key={doc.id}
            className="flex items-center space-x-3 text-blue-700 hover:underline"
          >
            <button
                onClick={async () => {
                    try {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_BASE_URL}/documents/presigned-view-url/?file_key=${encodeURIComponent(doc.title)}`,
                        {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                        }
                    )

                    if (!res.ok) {
                        throw new Error("Failed to get presigned URL")
                    }

                    const data = await res.json()
                    const url = data.presigned_url
                    window.open(url, "_blank") 
                    } catch (err) {
                    console.error(err)
                    alert("Could not open the document.")
                    }
                }}
                className="flex items-center space-x-2 text-blue-700 hover:underline"
                >
                <FileText className="w-5 h-5 text-blue-500" />
                <span>{doc.title || doc.file_key}</span>
                </button>
                {/* <a href={presignedUrl} target="_blank" rel="noopener noreferrer">
                    {doc.title || doc.file_key}
                </a> */}


          </li>
        )
      })}
    </ul>
  )}
</div>

    </div>
  )
}






























