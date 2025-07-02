"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  User,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Shield,
  AlertTriangle,
  Zap,
  Pause,
  Activity,
  TrendingUp,
} from "lucide-react"

interface UsernameResult {
  username: string
  status: "available" | "taken" | "checking" | "error" | "censored" | "rate-limited"
  message?: string
}

// Basic content filter - in production, you'd want a more comprehensive list
const CENSORED_WORDS = [
  // Placeholder examples - replace with actual content filtering rules
  "badword1",
  "badword2",
  "inappropriate",
  "offensive",
  // Add actual filtering words as needed
  "admin",
  "moderator",
  "roblox",
  "robux",
]

export default function RobloxUsernameChecker() {
  const [singleUsername, setSingleUsername] = useState("")
  const [bulkUsernames, setBulkUsernames] = useState("")
  const [results, setResults] = useState<UsernameResult[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [responseTime, setResponseTime] = useState(0)
  const [totalChecks, setTotalChecks] = useState(0)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [currentDelay, setCurrentDelay] = useState(500)

  const isCensored = (username: string): boolean => {
    const lowerUsername = username.toLowerCase()
    return CENSORED_WORDS.some((word) => lowerUsername.includes(word.toLowerCase()))
  }

  const checkUsername = async (username: string): Promise<UsernameResult> => {
    const startTime = Date.now()

    // First check if username contains censored content
    if (isCensored(username)) {
      const endTime = Date.now()
      setResponseTime(endTime - startTime)
      setTotalChecks((prev) => prev + 1)
      return {
        username,
        status: "censored",
        message: "Username contains inappropriate content",
      }
    }

    try {
      // Use our API route instead of calling Roblox directly
      const response = await fetch("/api/check-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      })

      const endTime = Date.now()
      setResponseTime(endTime - startTime)
      setTotalChecks((prev) => prev + 1)

      if (response.ok) {
        const data = await response.json()

        // Handle rate limiting
        if (data.rateLimited || data.code === 429) {
          setIsRateLimited(true)
          setCurrentDelay((prev) => Math.min(prev * 2, 5000)) // Exponential backoff up to 5 seconds
          return {
            username,
            status: "rate-limited",
            message: "Rate limited - slowing down requests",
          }
        }

        // Reset rate limiting if successful
        if (isRateLimited) {
          setIsRateLimited(false)
          setCurrentDelay(500)
        }

        return {
          username,
          status: data.available ? "available" : "taken",
          message: data.message,
        }
      } else {
        return {
          username,
          status: "error",
          message: "Error checking username",
        }
      }
    } catch (error) {
      const endTime = Date.now()
      setResponseTime(endTime - startTime)
      setTotalChecks((prev) => prev + 1)

      console.error("Error checking username:", error)
      return {
        username,
        status: "error",
        message: "Network error occurred",
      }
    }
  }

  const handleSingleCheck = async () => {
    if (!singleUsername.trim()) return

    setIsChecking(true)
    const existingIndex = results.findIndex((r) => r.username.toLowerCase() === singleUsername.toLowerCase())

    if (existingIndex >= 0) {
      const updatedResults = [...results]
      updatedResults[existingIndex] = { username: singleUsername, status: "checking" }
      setResults(updatedResults)
    } else {
      setResults((prev) => [...prev, { username: singleUsername, status: "checking" }])
    }

    const result = await checkUsername(singleUsername)

    setResults((prev) => prev.map((r) => (r.username.toLowerCase() === singleUsername.toLowerCase() ? result : r)))
    setIsChecking(false)
    setSingleUsername("")
  }

  const handleBulkCheck = async () => {
    const usernames = bulkUsernames
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    if (usernames.length === 0) return

    setIsChecking(true)
    setProgress(0)
    setIsRateLimited(false)
    setCurrentDelay(500)

    // Add all usernames to results with checking status
    const newResults = usernames.map((username) => ({
      username,
      status: "checking" as const,
    }))

    setResults((prev) => {
      const existing = prev.filter((r) => !usernames.some((u) => u.toLowerCase() === r.username.toLowerCase()))
      return [...existing, ...newResults]
    })

    // Adaptive batch processing with rate limit handling
    let batchSize = 5 // Start with smaller batch size
    let currentDelay = 500

    for (let i = 0; i < usernames.length; i += batchSize) {
      const batch = usernames.slice(i, i + batchSize)

      // Process batch sequentially to avoid overwhelming the API
      const batchResults: UsernameResult[] = []
      for (const username of batch) {
        const result = await checkUsername(username)
        batchResults.push(result)

        // If we hit rate limiting, increase delay and reduce batch size
        if (result.status === "rate-limited") {
          currentDelay = Math.min(currentDelay * 2, 5000)
          batchSize = Math.max(1, Math.floor(batchSize / 2))
          await new Promise((resolve) => setTimeout(resolve, currentDelay))
        } else {
          // Small delay between individual requests in batch
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      setResults((prev) =>
        prev.map((r) => {
          const batchResult = batchResults.find((br) => br.username.toLowerCase() === r.username.toLowerCase())
          return batchResult || r
        }),
      )

      setProgress(Math.min(((i + batch.length) / usernames.length) * 100, 100))

      // Delay between batches
      if (i + batch.length < usernames.length) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay))
      }
    }

    setIsChecking(false)
    setBulkUsernames("")
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setBulkUsernames(text)
    } catch (error) {
      console.error("Error reading file:", error)
    }
  }

  const availableUsers = results.filter((r) => r.status === "available")
  const takenUsers = results.filter((r) => r.status === "taken")
  const checkingUsers = results.filter((r) => r.status === "checking")
  const errorUsers = results.filter((r) => r.status === "error")
  const censoredUsers = results.filter((r) => r.status === "censored")
  const rateLimitedUsers = results.filter((r) => r.status === "rate-limited")

  const clearResults = () => {
    setResults([])
    setProgress(0)
    setTotalChecks(0)
    setResponseTime(0)
    setIsRateLimited(false)
    setCurrentDelay(500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Clean Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">nanochecker</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fast and reliable Roblox username availability checker with smart bulk processing
          </p>
        </div>

        {/* Rate Limiting Alert */}
        {isRateLimited && (
          <Alert className="mb-8 border-amber-200 bg-amber-50">
            <Pause className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Rate Limited:</strong> Automatically slowing down requests to prevent blocking. Current delay:{" "}
              {currentDelay}ms
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Checks</p>
                  <p className="text-3xl font-bold text-blue-600">{totalChecks}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-3xl font-bold text-green-600">{availableUsers.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taken</p>
                  <p className="text-3xl font-bold text-red-600">{takenUsers.length + censoredUsers.length}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-3xl font-bold text-purple-600">{responseTime}ms</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Single Username Check */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                Single Check
              </CardTitle>
              <CardDescription className="text-gray-600">Check individual username availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter username to check"
                  value={singleUsername}
                  onChange={(e) => setSingleUsername(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSingleCheck()}
                  className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  onClick={handleSingleCheck}
                  disabled={isChecking || !singleUsername.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  {isChecking ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Checking
                    </>
                  ) : (
                    "Check"
                  )}
                </Button>
              </div>
              {singleUsername && isCensored(singleUsername) && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    This username may contain inappropriate content and could be rejected.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Bulk Username Check */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                Bulk Check
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Smart Processing</Badge>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Check multiple usernames with intelligent rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter usernames (one per line)&#10;example1&#10;example2&#10;example3"
                value={bulkUsernames}
                onChange={(e) => setBulkUsernames(e.target.value)}
                rows={4}
                className="border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleBulkCheck}
                  disabled={isChecking || !bulkUsernames.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isChecking ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Check All
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isChecking}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {isChecking && (
          <Card className="border-0 shadow-sm bg-white mb-8">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {isRateLimited ? (
                      <>
                        <Pause className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">Rate limited - slowing down</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Processing usernames</span>
                      </>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  Results
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearResults}
                  className="border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 bg-transparent"
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    All ({results.length})
                  </TabsTrigger>
                  <TabsTrigger value="available" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Available ({availableUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="taken" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Taken ({takenUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="censored" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Censored ({censoredUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="checking" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Processing ({checkingUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="error" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Errors ({errorUsers.length + rateLimitedUsers.length})
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="all" className="mt-0">
                    <UsernameList usernames={results} />
                  </TabsContent>

                  <TabsContent value="available" className="mt-0">
                    {availableUsers.length > 0 ? (
                      <UsernameList usernames={availableUsers} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No available usernames found yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="taken" className="mt-0">
                    {takenUsers.length > 0 ? (
                      <UsernameList usernames={takenUsers} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No taken usernames found yet</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="censored" className="mt-0">
                    {censoredUsers.length > 0 ? (
                      <div className="space-y-4">
                        <Alert className="border-orange-200 bg-orange-50">
                          <Shield className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-800">
                            These usernames contain content that may be filtered by Roblox's moderation system.
                          </AlertDescription>
                        </Alert>
                        <UsernameList usernames={censoredUsers} />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No censored usernames found</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="checking" className="mt-0">
                    {checkingUsers.length > 0 ? (
                      <UsernameList usernames={checkingUsers} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No usernames currently being processed</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="error" className="mt-0">
                    {errorUsers.length > 0 || rateLimitedUsers.length > 0 ? (
                      <UsernameList usernames={[...errorUsers, ...rateLimitedUsers]} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No errors encountered</p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Smart Filtering:</strong> Automatically detects inappropriate content and handles rate limiting to
              ensure reliable results.
            </AlertDescription>
          </Alert>

          <Alert className="border-green-200 bg-green-50">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Intelligent Processing:</strong> Adapts checking speed based on API responses for optimal
              performance without getting blocked.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

function UsernameList({ usernames }: { usernames: UsernameResult[] }) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {usernames.map((result, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">{result.username}</span>
            {result.message && <span className="text-sm text-gray-500">{result.message}</span>}
          </div>
          <Badge
            variant="outline"
            className={`font-medium ${
              result.status === "available"
                ? "border-green-200 bg-green-50 text-green-700"
                : result.status === "taken"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : result.status === "censored"
                    ? "border-orange-200 bg-orange-50 text-orange-700"
                    : result.status === "checking"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : result.status === "rate-limited"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-gray-200 bg-gray-50 text-gray-700"
            }`}
          >
            {result.status === "checking" && <Clock className="h-3 w-3 mr-1 animate-spin" />}
            {result.status === "available" && <CheckCircle className="h-3 w-3 mr-1" />}
            {result.status === "taken" && <XCircle className="h-3 w-3 mr-1" />}
            {result.status === "censored" && <Shield className="h-3 w-3 mr-1" />}
            {result.status === "rate-limited" && <Pause className="h-3 w-3 mr-1" />}
            {result.status === "rate-limited"
              ? "Rate Limited"
              : result.status.charAt(0).toUpperCase() + result.status.slice(1)}
          </Badge>
        </div>
      ))}
    </div>
  )
}
