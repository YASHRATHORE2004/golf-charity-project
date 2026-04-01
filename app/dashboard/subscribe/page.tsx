"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2, Heart, ArrowRight, ArrowLeft, Info } from "lucide-react"
import { toast } from "sonner"
import type { SubscriptionPlan, Charity } from "@/lib/types"

export default function SubscribePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [selectedCharity, setSelectedCharity] = useState<string>("")
  const [charityPercentage, setCharityPercentage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const [plansRes, charitiesRes] = await Promise.all([
      supabase.from("subscription_plans").select("*").eq("is_active", true),
      supabase.from("charities").select("*").eq("is_active", true)
    ])

    if (plansRes.data) setPlans(plansRes.data)
    if (charitiesRes.data) setCharities(charitiesRes.data)
    setLoading(false)
  }

  const handleSubscribe = async () => {
    if (!selectedPlan || !selectedCharity) {
      toast.error("Please select a plan and charity")
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please log in")
      setSubmitting(false)
      return
    }

    const plan = plans.find(p => p.id === selectedPlan)
    const endDate = new Date()
    const renewalDate = new Date()
    
    if (plan?.interval === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1)
      renewalDate.setMonth(renewalDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
      renewalDate.setFullYear(renewalDate.getFullYear() + 1)
    }

    const { error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id: selectedPlan,
        charity_id: selectedCharity,
        charity_percentage: charityPercentage,
        status: "active",
        end_date: endDate.toISOString(),
        renewal_date: renewalDate.toISOString()
      })

    if (error) {
      toast.error("Failed to create subscription")
      setSubmitting(false)
      return
    }

    // Record charity contribution
    const charityAmount = (Number(plan?.price) * charityPercentage) / 100
    await supabase
      .from("charity_contributions")
      .insert({
        user_id: user.id,
        charity_id: selectedCharity,
        amount: charityAmount,
        contribution_type: "subscription"
      })

    toast.success("Subscription created successfully!")
    router.push("/dashboard")
    router.refresh()
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)
  const selectedCharityData = charities.find(c => c.id === selectedCharity)
  const charityAmount = selectedPlanData 
    ? (Number(selectedPlanData.price) * charityPercentage) / 100 
    : 0

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
        <h1 className="text-3xl font-bold tracking-tight">Subscribe</h1>
        <p className="text-muted-foreground">
          Choose your plan, select a charity, and start making a difference
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[
          { num: 1, label: "Choose Plan" },
          { num: 2, label: "Select Charity" },
          { num: 3, label: "Confirm" }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center justify-center h-10 w-10 rounded-full font-semibold ${
              step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {i < 2 && <div className={`mx-4 h-0.5 w-12 ${step > s.num ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Plan */}
      {step === 1 && (
        <div className="space-y-6">
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <Label
                  key={plan.id}
                  htmlFor={plan.id}
                  className={`cursor-pointer rounded-lg border-2 p-6 transition-colors ${
                    selectedPlan === plan.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{plan.name}</h3>
                        {plan.interval === "yearly" && (
                          <Badge className="bg-accent text-accent-foreground">Save 20%</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                      <p className="mt-4">
                        <span className="text-3xl font-bold">${Number(plan.price).toFixed(2)}</span>
                        <span className="text-muted-foreground">/{plan.interval === "monthly" ? "mo" : "yr"}</span>
                      </p>
                    </div>
                    {selectedPlan === plan.id && (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </Label>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!selectedPlan}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Charity */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-4 p-4">
              <Info className="mt-0.5 h-5 w-5 text-primary" />
              <p className="text-sm">
                A minimum of 10% of your subscription goes to your chosen charity. 
                You can increase this percentage to make an even bigger impact!
              </p>
            </CardContent>
          </Card>

          <RadioGroup value={selectedCharity} onValueChange={setSelectedCharity}>
            <div className="grid gap-4 md:grid-cols-2">
              {charities.map((charity) => (
                <Label
                  key={charity.id}
                  htmlFor={charity.id}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    selectedCharity === charity.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={charity.id} id={charity.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{charity.name}</h3>
                        {charity.is_featured && <Badge variant="secondary">Featured</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {charity.description}
                      </p>
                    </div>
                  </div>
                </Label>
              ))}
            </div>
          </RadioGroup>

          {selectedCharity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  Charity Contribution
                </CardTitle>
                <CardDescription>
                  Adjust how much of your subscription goes to charity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Contribution: {charityPercentage}%</span>
                    <span className="text-lg font-bold text-primary">${charityAmount.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[charityPercentage]}
                    onValueChange={(v) => setCharityPercentage(v[0])}
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
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!selectedCharity}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && selectedPlanData && selectedCharityData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{selectedPlanData.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">${Number(selectedPlanData.price).toFixed(2)}/{selectedPlanData.interval === "monthly" ? "month" : "year"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Charity</span>
                <span className="font-medium">{selectedCharityData.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Charity Contribution</span>
                <span className="font-medium text-primary">{charityPercentage}% (${charityAmount.toFixed(2)})</span>
              </div>
              <div className="flex justify-between py-2 text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">${Number(selectedPlanData.price).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/20">
            <CardContent className="flex items-center gap-4 p-4">
              <Heart className="h-8 w-8 text-success" />
              <div>
                <p className="font-medium">Making a Difference</p>
                <p className="text-sm text-muted-foreground">
                  ${charityAmount.toFixed(2)} of your subscription will go to {selectedCharityData.name}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleSubscribe} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Subscription
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
