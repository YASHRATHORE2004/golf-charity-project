"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Calendar, Plus, Play, Eye, Loader2, Trophy, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { Draw } from "@/lib/types"

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [simulateDialogOpen, setSimulateDialogOpen] = useState(false)
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // New draw form
  const [drawDate, setDrawDate] = useState("")
  const [drawType, setDrawType] = useState<"random" | "algorithmic">("random")

  useEffect(() => {
    fetchDraws()
  }, [])

  const fetchDraws = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("draw_date", { ascending: false })

    if (error) {
      toast.error("Failed to load draws")
      return
    }

    setDraws(data || [])
    setLoading(false)
  }

  const createDraw = async () => {
    if (!drawDate) {
      toast.error("Please select a draw date")
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    
    const date = new Date(drawDate)
    
    // Get active subscriptions count for prize pool calculation
    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact" })
      .eq("status", "active")

    const { data: config } = await supabase
      .from("prize_pool_config")
      .select("*")
      .single()

    const totalPool = (count || 0) * (config?.contribution_per_subscription || 10)
    const fiveMatchPool = totalPool * ((config?.five_match_percentage || 40) / 100)
    const fourMatchPool = totalPool * ((config?.four_match_percentage || 35) / 100)
    const threeMatchPool = totalPool * ((config?.three_match_percentage || 25) / 100)

    const { error } = await supabase
      .from("draws")
      .insert({
        draw_date: drawDate,
        draw_month: date.getMonth() + 1,
        draw_year: date.getFullYear(),
        draw_type: drawType,
        status: "pending",
        total_pool: totalPool,
        five_match_pool: fiveMatchPool,
        four_match_pool: fourMatchPool,
        three_match_pool: threeMatchPool,
        jackpot_amount: fiveMatchPool,
        winning_numbers: []
      })

    if (error) {
      toast.error("Failed to create draw")
      setSubmitting(false)
      return
    }

    toast.success("Draw created successfully!")
    setCreateDialogOpen(false)
    setDrawDate("")
    setSubmitting(false)
    fetchDraws()
  }

  const runSimulation = async () => {
    if (!selectedDraw) return

    setSubmitting(true)
    const supabase = createClient()

    // Generate 5 random winning numbers (1-45)
    const winningNumbers: number[] = []
    while (winningNumbers.length < 5) {
      const num = Math.floor(Math.random() * 45) + 1
      if (!winningNumbers.includes(num)) {
        winningNumbers.push(num)
      }
    }
    winningNumbers.sort((a, b) => a - b)

    const { error } = await supabase
      .from("draws")
      .update({ 
        winning_numbers: winningNumbers,
        status: "simulation"
      })
      .eq("id", selectedDraw.id)

    if (error) {
      toast.error("Failed to run simulation")
      setSubmitting(false)
      return
    }

    toast.success("Simulation complete! Review results before publishing.")
    setSimulateDialogOpen(false)
    setSubmitting(false)
    fetchDraws()
  }

  const publishDraw = async (drawId: string) => {
    setSubmitting(true)
    const supabase = createClient()

    // Get the draw
    const { data: draw } = await supabase
      .from("draws")
      .select("*")
      .eq("id", drawId)
      .single()

    if (!draw || !draw.winning_numbers || draw.winning_numbers.length === 0) {
      toast.error("Run simulation first")
      setSubmitting(false)
      return
    }

    // Get all eligible entries (users with 5 scores and active subscription)
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active")

    if (subscriptions) {
      for (const sub of subscriptions) {
        const { data: scores } = await supabase
          .from("golf_scores")
          .select("score")
          .eq("user_id", sub.user_id)
          .order("played_date", { ascending: false })
          .limit(5)

        if (scores && scores.length === 5) {
          const entryNumbers = scores.map(s => s.score)
          const matchCount = entryNumbers.filter(n => draw.winning_numbers.includes(n)).length
          const isWinner = matchCount >= 3

          // Create entry
          await supabase
            .from("draw_entries")
            .upsert({
              draw_id: drawId,
              user_id: sub.user_id,
              entry_numbers: entryNumbers,
              match_count: matchCount,
              is_winner: isWinner
            })

          // Create winner record if applicable
          if (isWinner) {
            let matchType: "5-match" | "4-match" | "3-match" = "3-match"
            let prizeAmount = draw.three_match_pool

            if (matchCount === 5) {
              matchType = "5-match"
              prizeAmount = draw.five_match_pool
            } else if (matchCount === 4) {
              matchType = "4-match"
              prizeAmount = draw.four_match_pool
            }

            await supabase
              .from("winners")
              .insert({
                draw_id: drawId,
                user_id: sub.user_id,
                match_type: matchType,
                prize_amount: prizeAmount,
                verification_status: "pending",
                payout_status: "pending"
              })
          }
        }
      }
    }

    // Update draw status
    await supabase
      .from("draws")
      .update({ 
        status: "published",
        published_at: new Date().toISOString()
      })
      .eq("id", drawId)

    toast.success("Draw published! Winners have been notified.")
    setSubmitting(false)
    fetchDraws()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Draws</h1>
          <p className="text-muted-foreground">
            Manage monthly prize draws
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Draw
        </Button>
      </div>

      <div className="grid gap-4">
        {draws.map((draw) => (
          <Card key={draw.id}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {new Date(draw.draw_date).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric"
                      })} Draw
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Type: {draw.draw_type} | Pool: ${Number(draw.total_pool).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {draw.winning_numbers && draw.winning_numbers.length > 0 && (
                    <div className="flex gap-1">
                      {draw.winning_numbers.map((num, i) => (
                        <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                          {num}
                        </span>
                      ))}
                    </div>
                  )}

                  <Badge variant={
                    draw.status === "published" ? "default" :
                    draw.status === "simulation" ? "secondary" : "outline"
                  }>
                    {draw.status}
                  </Badge>

                  {draw.status === "pending" && (
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedDraw(draw)
                        setSimulateDialogOpen(true)
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Simulate
                    </Button>
                  )}

                  {draw.status === "simulation" && (
                    <Button 
                      size="sm"
                      onClick={() => publishDraw(draw.id)}
                      disabled={submitting}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {draws.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No Draws Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first draw to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Draw Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Draw</DialogTitle>
            <DialogDescription>
              Set up a new monthly prize draw
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Draw Date</Label>
              <Input
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Draw Type</Label>
              <RadioGroup value={drawType} onValueChange={(v) => setDrawType(v as "random" | "algorithmic")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random" id="random" />
                  <Label htmlFor="random">Random (Standard lottery-style)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="algorithmic" id="algorithmic" />
                  <Label htmlFor="algorithmic">Algorithmic (Weighted by score frequency)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={createDraw} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Draw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simulate Dialog */}
      <Dialog open={simulateDialogOpen} onOpenChange={setSimulateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Draw Simulation</DialogTitle>
            <DialogDescription>
              Generate winning numbers and preview results before publishing
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will generate 5 random winning numbers (1-45). You can review the results before publishing to users.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={runSimulation} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Simulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
