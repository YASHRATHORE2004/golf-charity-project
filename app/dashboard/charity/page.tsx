"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Heart, Search, Loader2, DollarSign, TrendingUp, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { Charity, Subscription, CharityContribution } from "@/lib/types"

export default function CharityPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [contributions, setContributions] = useState<CharityContribution[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [donationAmount, setDonationAmount] = useState("")
  const [selectedCharityForDonation, setSelectedCharityForDonation] = useState<Charity | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editPercentageOpen, setEditPercentageOpen] = useState(false)
  const [newPercentage, setNewPercentage] = useState(10)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const [charitiesRes, subscriptionRes, contributionsRes] = await Promise.all([
      supabase.from("charities").select("*").eq("is_active", true),
      supabase.from("subscriptions").select("*, charity:charities(*)").eq("user_id", user.id).eq("status", "active").single(),
      supabase.from("charity_contributions").select("*, charity:charities(*)").eq("user_id", user.id).order("created_at", { ascending: false })
    ])

    if (charitiesRes.data) setCharities(charitiesRes.data)
    if (subscriptionRes.data) {
      setSubscription(subscriptionRes.data)
      setNewPercentage(subscriptionRes.data.charity_percentage)
    }
    if (contributionsRes.data) setContributions(contributionsRes.data)
    setLoading(false)
  }

  const handleDonate = async () => {
    const amount = parseFloat(donationAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!selectedCharityForDonation) return

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please log in")
      setSubmitting(false)
      return
    }

    const { error } = await supabase
      .from("charity_contributions")
      .insert({
        user_id: user.id,
        charity_id: selectedCharityForDonation.id,
        amount,
        contribution_type: "donation"
      })

    if (error) {
      toast.error("Failed to process donation")
      setSubmitting(false)
      return
    }

    toast.success(`Thank you for your $${amount.toFixed(2)} donation to ${selectedCharityForDonation.name}!`)
    setDonationAmount("")
    setDialogOpen(false)
    setSubmitting(false)
    fetchData()
  }

  const handleUpdatePercentage = async () => {
    if (!subscription) return

    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("subscriptions")
      .update({ charity_percentage: newPercentage })
      .eq("id", subscription.id)

    if (error) {
      toast.error("Failed to update percentage")
      setSubmitting(false)
      return
    }

    toast.success("Charity percentage updated!")
    setEditPercentageOpen(false)
    setSubmitting(false)
    fetchData()
  }

  const filteredCharities = charities.filter(charity =>
    charity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    charity.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalContributed = contributions.reduce((sum, c) => sum + Number(c.amount), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Charity</h1>
        <p className="text-muted-foreground">
          Support causes you care about through your subscription and donations
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Charity</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {subscription?.charity?.name || "None selected"}
            </div>
            {subscription && (
              <p className="text-xs text-muted-foreground">
                {subscription.charity_percentage}% of subscription
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">${totalContributed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {contributions.length} contribution{contributions.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contribution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{subscription?.charity_percentage || 10}%</div>
            {subscription && (
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs"
                onClick={() => setEditPercentageOpen(true)}
              >
                Adjust percentage
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charities Directory */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Charity Directory</CardTitle>
              <CardDescription>Browse and support our partner charities</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search charities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCharities.map((charity) => (
              <Card key={charity.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{charity.name}</h3>
                        {charity.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {subscription?.charity_id === charity.id && (
                          <Badge className="bg-success text-success-foreground">Your Charity</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {charity.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedCharityForDonation(charity)
                            setDialogOpen(true)
                          }}
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Donate
                        </Button>
                        {charity.website_url && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={charity.website_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contribution History */}
      {contributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contribution History</CardTitle>
            <CardDescription>Your donations and subscription contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contributions.slice(0, 10).map((contribution) => (
                <div key={contribution.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contribution.charity?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contribution.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(contribution.amount).toFixed(2)}</p>
                    <Badge variant="outline">{contribution.contribution_type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Donation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Donation</DialogTitle>
            <DialogDescription>
              Support {selectedCharityForDonation?.name} with a one-time donation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                min={1}
                step={0.01}
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setDonationAmount(amount.toString())}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleDonate} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Donate ${donationAmount || "0"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Percentage Dialog */}
      <Dialog open={editPercentageOpen} onOpenChange={setEditPercentageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Charity Percentage</DialogTitle>
            <DialogDescription>
              Change how much of your subscription goes to charity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Contribution: {newPercentage}%</span>
              </div>
              <Slider
                value={[newPercentage]}
                onValueChange={(v) => setNewPercentage(v[0])}
                min={10}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>10% (Minimum)</span>
                <span>50% (Maximum)</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdatePercentage} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
