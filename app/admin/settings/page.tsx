"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Lock, Loader2, Percent, DollarSign } from "lucide-react"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  
  // Platform Config State
  const [configId, setConfigId] = useState("")
  const [config, setConfig] = useState({
    five_match_percentage: 40,
    four_match_percentage: 35,
    three_match_percentage: 25,
    contribution_per_subscription: 10
  })

  // Password State
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("prize_pool_config")
      .select("*")
      .single()

    if (data) {
      setConfigId(data.id)
      setConfig({
        five_match_percentage: data.five_match_percentage,
        four_match_percentage: data.four_match_percentage,
        three_match_percentage: data.three_match_percentage,
        contribution_per_subscription: data.contribution_per_subscription
      })
    }
    setLoading(false)
  }

  const handleConfigUpdate = async () => {
    // Validate percentages equal 100%
    const total = Number(config.five_match_percentage) + Number(config.four_match_percentage) + Number(config.three_match_percentage)
    if (total !== 100) {
      toast.error(`Percentages must equal 100%. Currently: ${total}%`)
      return
    }

    setSavingConfig(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("prize_pool_config")
      .update(config)
      .eq("id", configId)

    if (error) {
      toast.error("Failed to update platform settings")
    } else {
      toast.success("Platform settings updated successfully")
    }
    setSavingConfig(false)
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
      toast.error(error.message || "Failed to update password")
    } else {
      toast.success("Password updated successfully")
      setPassword("")
      setConfirmPassword("")
    }
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage global platform configuration and security
        </p>
      </div>

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Platform Configuration
          </CardTitle>
          <CardDescription>
            Adjust the prize pool distribution and subscription parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-medium flex items-center gap-2"><Percent className="h-4 w-4 text-muted-foreground"/> Prize Pool Distribution</h3>
              <span className={`text-sm font-bold ${
                (Number(config.five_match_percentage) + Number(config.four_match_percentage) + Number(config.three_match_percentage)) === 100 
                ? 'text-success' : 'text-destructive'
              }`}>
                Total: {Number(config.five_match_percentage) + Number(config.four_match_percentage) + Number(config.three_match_percentage)}%
              </span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>5-Match (Jackpot) %</Label>
                <Input 
                  type="number" 
                  min="0" max="100" 
                  value={config.five_match_percentage} 
                  onChange={(e) => setConfig({...config, five_match_percentage: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>4-Match %</Label>
                <Input 
                  type="number" 
                  min="0" max="100" 
                  value={config.four_match_percentage} 
                  onChange={(e) => setConfig({...config, four_match_percentage: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>3-Match %</Label>
                <Input 
                  type="number" 
                  min="0" max="100" 
                  value={config.three_match_percentage} 
                  onChange={(e) => setConfig({...config, three_match_percentage: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-medium flex items-center gap-2 border-b pb-2"><DollarSign className="h-4 w-4 text-muted-foreground"/> Subscription Parameters</h3>
            <div className="space-y-2">
              <Label>Prize Pool Contribution per Active Subscription ($)</Label>
              <Input 
                type="number" 
                step="0.01" 
                min="0" 
                value={config.contribution_per_subscription} 
                onChange={(e) => setConfig({...config, contribution_per_subscription: Number(e.target.value)})}
              />
              <p className="text-xs text-muted-foreground">Amount added to the total prize pool per user, per month.</p>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end border-t p-6">
          <Button onClick={handleConfigUpdate} disabled={savingConfig}>
            {savingConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Platform Config
          </Button>
        </CardFooter>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Security
          </CardTitle>
          <CardDescription>
            Update your admin account password
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordUpdate}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t p-6">
            <Button type="submit" variant="outline" disabled={savingPassword || !password || !confirmPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}