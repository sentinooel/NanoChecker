"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  Activity,
  CheckCircle,
  XCircle,
  User,
  Upload,
  Download,
  FileText,
  Trash2,
  AlertTriangle,
  MessageCircle,
  Search,
  List,
  Clock,
  X,
  ExternalLink,
  Users,
} from "lucide-react"

interface ValidationResponse {
  code: number
  message: string
  rateLimited?: boolean
  error?: boolean
}

interface Stats {
  totalChecks: number
  available: number
  taken: number
  responseTime: number
}

interface UsernameResult {
  username: string
  result?: ValidationResponse
  status: "processing" | "completed" | "error" | "rate-limited"
}

interface RateLimitEvent {
  timestamp: number
  duration: number
}

const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

// Rate Limit Popup Component
const RateLimitPopup = ({
  isVisible,
  countdown,
  averageWaitTime,
  onClose,
}: {
  isVisible: boolean
  countdown: number
  averageWaitTime: number
  onClose: () => void
}) => {
  if (!isVisible) return null

  const progress = averageWaitTime > 0 ? ((averageWaitTime - countdown) / averageWaitTime) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <div className="bg-slate-800 border border-red-500/50 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-full animate-pulse">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Rate Limited!</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-slate-700 rounded-full p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center space-y-4">
          <p className="text-gray-300 text-lg">API rate limit detected</p>

          <div className="flex items-center justify-center gap-3 p-4 bg-slate-700/50 rounded-xl border border-red-500/30">
            <Clock className="h-5 w-5 text-red-400 animate-spin" />
            <span className="text-2xl font-bold text-red-400 tabular-nums">{countdown}s</span>
          </div>

          <p className="text-sm text-gray-400">Waiting 2 seconds before retrying to avoid further rate limits...</p>

          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000 ease-linear"
              style={{ width: `${((2 - countdown) / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Discord Join Popup Component
const DiscordJoinPopup = ({
  isVisible,
  onClose,
}: {
  isVisible: boolean
  onClose: () => void
}) => {
  if (!isVisible) return null

  const handleJoinDiscord = () => {
    window.open("https://discord.gg/Xn4Bnw4pJQ", "_blank")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <div className="bg-slate-800 border border-indigo-500/50 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-full animate-pulse">
              <DiscordIcon />
            </div>
            <h3 className="text-xl font-bold text-white">Join Our Discord!</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-slate-700 rounded-full p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-indigo-400">
              <Users className="h-5 w-5" />
              <span className="font-semibold">nanochecker Community</span>
            </div>
            <p className="text-gray-300 text-lg">Connect with other users and get support!</p>
          </div>

          <div className="bg-slate-700/50 rounded-xl p-4 border border-indigo-500/30">
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Get help and support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Share username lists</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Latest updates & features</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Connect with the community</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleJoinDiscord}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Discord
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6 bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600 hover:text-white rounded-xl hover:scale-105 transition-all duration-300"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-gray-500">discord.gg/Xn4Bnw4pJQ</p>
        </div>
      </div>
    </div>
  )
}

export default function NanoChecker() {
  const [username, setUsername] = useState("")
  const [bulkUsernames, setBulkUsernames] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBulkLoading, setIsBulkLoading] = useState(false)
  const [result, setResult] = useState<ValidationResponse | null>(null)
  const [bulkResults, setBulkResults] = useState<UsernameResult[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [progress, setProgress] = useState(0)
  const [processingSpeed, setProcessingSpeed] = useState(0)
  const [showRateLimitPopup, setShowRateLimitPopup] = useState(false)
  const [showDiscordPopup, setShowDiscordPopup] = useState(false)
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)
  const [rateLimitHistory, setRateLimitHistory] = useState<RateLimitEvent[]>([])
  const [currentRateLimitStart, setCurrentRateLimitStart] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<number>(0)

  const [stats, setStats] = useState<Stats>({
    totalChecks: 0,
    available: 0,
    taken: 0,
    responseTime: 0,
  })

  // Calculate average rate limit duration
  const getAverageRateLimitDuration = (): number => {
    if (rateLimitHistory.length === 0) return 30 // Default estimate

    const recentEvents = rateLimitHistory.slice(-5) // Last 5 events
    const totalDuration = recentEvents.reduce((sum, event) => sum + event.duration, 0)
    return Math.round(totalDuration / recentEvents.length)
  }

  // Rate limit countdown effect with dynamic testing
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (showRateLimitPopup && rateLimitCountdown > 0) {
      // Update countdown every second
      interval = setInterval(() => {
        setRateLimitCountdown((prev) => {
          if (prev <= 1) {
            setShowRateLimitPopup(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [showRateLimitPopup, rateLimitCountdown])

  const showRateLimitNotification = () => {
    setCurrentRateLimitStart(Date.now())
    setRateLimitCountdown(2) // Fixed 2 seconds
    setShowRateLimitPopup(true)
  }

  const handleDiscordClick = () => {
    setShowDiscordPopup(true)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    const validTypes = ["text/plain", "text/csv", "application/csv"]
    const validExtensions = [".txt", ".csv"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert("Please upload a valid text file (.txt or .csv)")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        // Parse content - handle both comma-separated and newline-separated
        let usernames: string[]

        if (file.name.toLowerCase().endsWith(".csv")) {
          // For CSV files, try to parse as comma-separated first
          usernames = content.split(/[,\n\r]+/)
        } else {
          // For text files, split by newlines
          usernames = content.split(/[\n\r]+/)
        }

        // Clean up usernames - remove empty strings and trim whitespace
        const cleanedUsernames = usernames
          .map((username) => username.trim())
          .filter((username) => username.length > 0)
          .slice(0, 10000) // Limit to 10,000 usernames for performance

        if (cleanedUsernames.length === 0) {
          alert("No valid usernames found in the file")
          return
        }

        setBulkUsernames(cleanedUsernames.join("\n"))

        // Show success message
        alert(`Successfully loaded ${cleanedUsernames.length} usernames from file`)
      }
    }

    reader.onerror = () => {
      alert("Error reading file. Please try again.")
    }

    reader.readAsText(file)

    // Reset file input
    event.target.value = ""
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  // Enhanced username checking with better error handling
  const checkUsername = async (usernameToCheck: string): Promise<ValidationResponse> => {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Increased timeout

      const response = await fetch(`/api/check-username?username=${encodeURIComponent(usernameToCheck)}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle non-200 responses
      if (!response.ok) {
        if (response.status === 429) {
          return {
            code: -1,
            message: "Rate limited",
            rateLimited: true,
          }
        }

        return {
          code: -1,
          message: `HTTP ${response.status}`,
          error: true,
        }
      }

      // Try to parse JSON
      let data: ValidationResponse
      try {
        data = await response.json()
      } catch (parseError) {
        // If JSON parsing fails, it might be HTML from rate limiting
        const text = await response.text()
        if (text.includes("Too Many Requests") || text.includes("Rate limit")) {
          return {
            code: -1,
            message: "Rate limited by API",
            rateLimited: true,
          }
        }

        return {
          code: -1,
          message: "Invalid API response",
          error: true,
        }
      }

      const responseTime = Date.now() - startTime

      // Only update stats for successful requests
      if (!data.error && !data.rateLimited) {
        setStats((prev) => ({
          totalChecks: prev.totalChecks + 1,
          available: prev.available + (data.code === 0 ? 1 : 0),
          taken: prev.taken + (data.code === 1 ? 1 : 0),
          responseTime: Math.round((prev.responseTime + responseTime) / 2),
        }))
      }

      return data
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          code: -1,
          message: "Request timeout",
          error: true,
        }
      }

      return {
        code: -1,
        message: "Network error",
        error: true,
      }
    }
  }

  const handleSingleCheck = async () => {
    if (!username.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const data = await checkUsername(username)
      setResult(data)
    } catch (err) {
      console.error("Error checking username:", err)
      setResult({
        code: -1,
        message: "Error checking username",
        error: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkCheck = async () => {
    const usernames = bulkUsernames
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    if (usernames.length === 0) return

    setIsBulkLoading(true)
    setProgress(0)
    setProcessingSpeed(0)
    startTimeRef.current = Date.now()

    // Remove duplicates for efficiency
    const uniqueUsernames = [...new Set(usernames)]

    // Initialize all usernames as processing
    const initialResults: UsernameResult[] = uniqueUsernames.map((username) => ({
      username,
      status: "processing",
    }))
    setBulkResults(initialResults)

    let completedCount = 0
    let concurrency = 4 // Start with 4 concurrent requests instead of 2
    let rateLimitHits = 0
    let consecutiveSuccesses = 0
    const maxConcurrency = 8 // Increase max from 4 to 8
    const minConcurrency = 2 // Increase min from 1 to 2

    // Create a queue for processing
    const queue = [...uniqueUsernames]
    const processing = new Set<string>()

    const updateProgress = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const speed = elapsed > 0 ? Math.round(completedCount / elapsed) : 0
      setProgress((completedCount / uniqueUsernames.length) * 100)
      setProcessingSpeed(speed)
    }

    const processUsername = async (username: string, index: number): Promise<void> => {
      processing.add(username)

      try {
        const result = await checkUsername(username)

        if (result.rateLimited) {
          rateLimitHits++
          consecutiveSuccesses = 0

          // Show rate limit popup with 2 second timing
          showRateLimitNotification()

          // Drop to minimum concurrency when rate limited
          concurrency = minConcurrency

          setBulkResults((prev) =>
            prev.map((item, i) => (i === index ? { ...item, result, status: "rate-limited" as const } : item)),
          )

          // Wait exactly 2 seconds before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000))

          // Retry the username
          queue.unshift(username)
        } else if (result.error) {
          setBulkResults((prev) =>
            prev.map((item, i) => (i === index ? { ...item, result, status: "error" as const } : item)),
          )
        } else {
          consecutiveSuccesses++

          // Moderate speed up for 4 checks/s average
          if (consecutiveSuccesses >= 30 && rateLimitHits === 0 && concurrency < maxConcurrency) {
            concurrency = Math.min(maxConcurrency, concurrency + 1)
          }

          setBulkResults((prev) =>
            prev.map((item, i) => (i === index ? { ...item, result, status: "completed" as const } : item)),
          )
        }

        completedCount++
        updateProgress()
      } catch (error) {
        setBulkResults((prev) => prev.map((item, i) => (i === index ? { ...item, status: "error" as const } : item)))
        completedCount++
        updateProgress()
      } finally {
        processing.delete(username)
      }
    }

    // Main processing loop - Target 6+ checks/second
    try {
      while (queue.length > 0 || processing.size > 0) {
        // Start new requests up to concurrency limit
        while (queue.length > 0 && processing.size < concurrency) {
          const username = queue.shift()!
          const index = uniqueUsernames.indexOf(username)

          // Don't wait for the promise - let it run concurrently
          processUsername(username, index).catch(console.error)

          // Reduced base delay of 150ms for ~6+ checks per second
          const baseDelay = 150
          const delay = rateLimitHits > 0 ? baseDelay + rateLimitHits * 50 : baseDelay
          await new Promise((resolve) => setTimeout(resolve, delay))
        }

        // Shorter loop delay
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Reduced adaptive delay
        if (rateLimitHits > 0) {
          const delay = Math.min(3000, rateLimitHits * 300)
          await new Promise((resolve) => setTimeout(resolve, delay))

          // Reset rate limit counter faster
          if (Math.random() < 0.2) {
            rateLimitHits = Math.max(0, rateLimitHits - 1)
          }
        }
      }

      // Wait for all remaining requests to complete
      while (processing.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    } catch (err) {
      console.error("Error in bulk check:", err)
    } finally {
      setIsBulkLoading(false)
      setProgress(100)

      // Final speed calculation
      const totalTime = (Date.now() - startTimeRef.current) / 1000
      const finalSpeed = Math.round(uniqueUsernames.length / totalTime)
      setProcessingSpeed(finalSpeed)
    }
  }

  const downloadValidUsernames = () => {
    const validUsernames = bulkResults
      .filter((item) => item.result?.code === 0)
      .map((item) => item.username)
      .join("\n")

    if (validUsernames.length === 0) {
      return
    }

    const blob = new Blob([validUsernames], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "valid.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearAllResults = () => {
    setBulkResults([])
    setProgress(0)
    setProcessingSpeed(0)
    setStats({
      totalChecks: 0,
      available: 0,
      taken: 0,
      responseTime: 0,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSingleCheck()
  }

  const getFilteredResults = () => {
    switch (activeTab) {
      case "available":
        return bulkResults.filter((item) => item.result?.code === 0)
      case "taken":
        return bulkResults.filter((item) => item.result?.code === 1)
      case "censored":
        return bulkResults.filter((item) => item.result?.code === 2)
      case "processing":
        return bulkResults.filter((item) => item.status === "processing")
      case "errors":
        return bulkResults.filter((item) => item.status === "error" || item.status === "rate-limited")
      default:
        return bulkResults
    }
  }

  const getCounts = () => {
    return {
      all: bulkResults.length,
      available: bulkResults.filter((item) => item.result?.code === 0).length,
      taken: bulkResults.filter((item) => item.result?.code === 1).length,
      censored: bulkResults.filter((item) => item.result?.code === 2).length,
      processing: bulkResults.filter((item) => item.status === "processing").length,
      errors: bulkResults.filter((item) => item.status === "error" || item.status === "rate-limited").length,
    }
  }

  const counts = getCounts()
  const filteredResults = getFilteredResults()

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Rate Limit Popup */}
      <RateLimitPopup
        isVisible={showRateLimitPopup}
        countdown={rateLimitCountdown}
        averageWaitTime={getAverageRateLimitDuration()}
        onClose={() => setShowRateLimitPopup(false)}
      />

      {/* Discord Join Popup */}
      <DiscordJoinPopup isVisible={showDiscordPopup} onClose={() => setShowDiscordPopup(false)} />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h1 className="text-4xl font-bold text-white">nanochecker</h1>
            <Button
              onClick={handleDiscordClick}
              className="bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              <DiscordIcon />
              <span className="ml-2">Discord</span>
            </Button>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Fast and reliable Roblox username availability checker
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Checks</p>
                  <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                    {stats.totalChecks}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Available</p>
                  <p className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">
                    {stats.available}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Taken</p>
                  <p className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300">
                    {stats.taken}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Speed</p>
                  <p className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors duration-300">
                    {processingSpeed}/s
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Single Check */}
          <Card className="bg-slate-800 border-slate-700 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-white">Single Check</h2>
              </div>
              <p className="text-gray-400 mb-6">Check individual username availability</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter username to check"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500 transition-all duration-300"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Check Username
                    </>
                  )}
                </Button>
              </form>

              {result && (
                <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{username}</span>
                    <Badge
                      variant={
                        result.code === 0
                          ? "default"
                          : result.code === 1
                            ? "destructive"
                            : result.error || result.rateLimited
                              ? "destructive"
                              : "secondary"
                      }
                      className="animate-in zoom-in-50 duration-300"
                    >
                      {result.code === 0
                        ? "Available"
                        : result.code === 1
                          ? "Taken"
                          : result.rateLimited
                            ? "Rate Limited"
                            : result.error
                              ? "Error"
                              : "Invalid"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400">{result.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Check */}
          <Card className="bg-slate-800 border-slate-700 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <List className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold text-white">Bulk Check</h2>
              </div>
              <p className="text-gray-400 mb-6">Check multiple usernames at once</p>

              <div className="space-y-4">
                <Textarea
                  placeholder="Enter usernames (one per line)&#10;example1&#10;example2&#10;example3"
                  value={bulkUsernames}
                  onChange={(e) => setBulkUsernames(e.target.value)}
                  className="min-h-[120px] resize-none bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-orange-500 transition-all duration-300"
                  disabled={isBulkLoading}
                />

                {isBulkLoading && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>
                        Processing {bulkResults.length} usernames at {processingSpeed} checks/second
                      </span>
                      <span className="font-medium text-orange-400">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-700" />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv,application/csv"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />

                <div className="flex gap-3">
                  <Button
                    onClick={handleBulkCheck}
                    disabled={isBulkLoading || !bulkUsernames.trim()}
                    className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    {isBulkLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Check All
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-12 px-6 bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600 hover:text-white hover:scale-105 transition-all duration-300 hover:shadow-lg"
                    disabled={isBulkLoading}
                    onClick={triggerFileUpload}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {bulkResults.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 animate-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <h2 className="text-xl font-semibold text-white">Results</h2>
                  {processingSpeed > 0 && (
                    <Badge variant="outline" className="border-purple-500 text-purple-400 animate-pulse">
                      {processingSpeed} checks/sec
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3">
                  {counts.available > 0 && (
                    <Button
                      onClick={downloadValidUsernames}
                      variant="outline"
                      size="sm"
                      className="text-green-400 border-green-500 hover:bg-green-500 hover:text-white hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Valid ({counts.available})
                    </Button>
                  )}
                  <Button
                    onClick={clearAllResults}
                    variant="outline"
                    size="sm"
                    className="text-gray-400 border-slate-600 hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 mb-6 bg-slate-700 border-slate-600">
                  <TabsTrigger
                    value="all"
                    className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-600 hover:text-white transition-all duration-200"
                  >
                    All ({counts.all})
                  </TabsTrigger>
                  <TabsTrigger
                    value="available"
                    className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-600 hover:text-white transition-all duration-200"
                  >
                    Available ({counts.available})
                  </TabsTrigger>
                  <TabsTrigger
                    value="taken"
                    className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-600 hover:text-white transition-all duration-200"
                  >
                    Taken ({counts.taken})
                  </TabsTrigger>
                  <TabsTrigger
                    value="censored"
                    className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-600 hover:text-white transition-all duration-200"
                  >
                    Censored ({counts.censored})
                  </TabsTrigger>
                  <TabsTrigger
                    value="processing"
                    className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-600 hover:text-white transition-all duration-200"
                  >
                    Processing ({counts.processing})
                  </TabsTrigger>
                  <TabsTrigger
                    value="errors"
                    className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-slate-600 hover:text-white transition-all duration-200"
                  >
                    Errors ({counts.errors})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredResults.map((item, index) => (
                      <div
                        key={`${item.username}-${index}`}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-650 hover:scale-[1.02] transition-all duration-200 hover:shadow-md animate-in slide-in-from-left-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="font-medium text-white">{item.username}</span>
                        <div className="flex items-center gap-2">
                          {item.status === "processing" ? (
                            <Badge
                              variant="secondary"
                              className="bg-orange-500/20 text-orange-400 border-orange-500/50 animate-pulse"
                            >
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Processing
                            </Badge>
                          ) : item.status === "rate-limited" ? (
                            <Badge variant="destructive" className="animate-in zoom-in-50 duration-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Rate Limited
                            </Badge>
                          ) : item.status === "error" ? (
                            <Badge variant="destructive" className="animate-in zoom-in-50 duration-300">
                              Error
                            </Badge>
                          ) : item.result ? (
                            <Badge
                              variant={
                                item.result.code === 0
                                  ? "default"
                                  : item.result.code === 1
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="animate-in zoom-in-50 duration-300"
                            >
                              {item.result.code === 0 ? "Available" : item.result.code === 1 ? "Taken" : "Invalid"}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {filteredResults.length === 0 && (
                      <div className="text-center py-8 text-gray-500">No results in this category</div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 hover:scale-105 transition-all duration-300 hover:shadow-xl group">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Search className="h-6 w-6 text-blue-500 mt-1 group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                    Smart Rate Limiting
                  </h3>
                  <p className="text-gray-400">
                    Intelligent detection and adaptive waiting based on actual API recovery times.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 hover:scale-105 transition-all duration-300 hover:shadow-xl group">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <MessageCircle className="h-6 w-6 text-indigo-500 mt-1 group-hover:scale-110 transition-transform duration-300" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors duration-300">
                    Community Support
                  </h3>
                  <p className="text-gray-400">
                    Join our Discord server for support, updates, and to connect with other users.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
