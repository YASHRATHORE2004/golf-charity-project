"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Target, Plus, Trash2, Loader2, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"
import type { GolfScore } from "@/lib/types"

export default function ScoresPage() {
  const [scores, setScores] = useState<GolfScore[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newScore, setNewScore] = useState("")
  const [playedDate, setPlayedDate] = useState(new Date().toISOString().split("T")[0])
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data, error } = await supabase
      .from("golf_scores")
      .select("*")
      .eq("user_id", user.id)
      .order("played_date", { ascending: false })
      .limit(5)

    if (error) {
      toast.error("Failed to load scores")
      return
    }

    setScores(data || [])
    setLoading(false)
  }

  const handleAddScore = async () => {
    const scoreNum = parseInt(newScore)
    
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      toast.error("Score must be between 1 and 45")
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

    // If we already have 5 scores, delete the oldest one
    if (scores.length >= 5) {
      const oldestScore = scores[scores.length - 1]
      await supabase
        .from("golf_scores")
        .delete()
        .eq("id", oldestScore.id)
    }

    // Add new score
    const { error } = await supabase
      .from("golf_scores")
      .insert({
        user_id: user.id,
        score: scoreNum,
        played_date: playedDate
      })

    if (error) {
      toast.error("Failed to add score")
      setSubmitting(false)
      return
    }

    toast.success("Score added successfully")
    setNewScore("")
    setPlayedDate(new Date().toISOString().split("T")[0])
    setDialogOpen(false)
    setSubmitting(false)
    fetchScores()
  }

  const handleDeleteScore = async (scoreId: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from("golf_scores")
      .delete()
      .eq("id", scoreId)

    if (error) {
      toast.error("Failed to delete score")
      return
    }

    toast.success("Score deleted")
    fetchScores()
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
          <h1 className="text-3xl font-bold tracking-tight">My Scores</h1>
          <p className="text-muted-foreground">
            Manage your golf scores for the monthly draw
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Score
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Golf Score</DialogTitle>
              <DialogDescription>
                Enter your Stableford score (1-45 points)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="score">Score (1-45)</Label>
                <Input
                  id="score"
                  type="number"
                  min={1}
                  max={45}
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  placeholder="Enter your score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date Played</Label>
                <Input
                  id="date"
                  type="date"
                  value={playedDate}
                  onChange={(e) => setPlayedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              {scores.length >= 5 && (
                <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-warning" />
                  <span className="text-warning">
                    Adding a new score will replace your oldest score.
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddScore} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Score
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-6">
          <Info className="mt-0.5 h-5 w-5 text-primary" />
          <div className="space-y-1">
            <p className="font-medium">How Scores Work</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Enter your last 5 golf scores in Stableford format (1-45 points)</li>
              <li>Only your most recent 5 scores are kept - new scores replace the oldest</li>
              <li>Your 5 scores become your entry numbers for the monthly draw</li>
              <li>Scores are displayed in reverse chronological order (most recent first)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Scores List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Your Scores ({scores.length}/5)
          </CardTitle>
          <CardDescription>
            {scores.length < 5 
              ? `Add ${5 - scores.length} more score${5 - scores.length !== 1 ? 's' : ''} to participate in draws`
              : "You have all 5 scores - you're eligible for draws!"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scores.length > 0 ? (
            <div className="space-y-3">
              {scores.map((score, index) => (
                <div 
                  key={score.id} 
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                      {score.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Score #{index + 1}</p>
                        <Badge variant="outline">Entry Number: {score.score}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Played on {new Date(score.played_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteScore(score.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No Scores Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first golf score to get started
              </p>
              <Button className="mt-6" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Score
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Numbers Preview */}
      {scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Entry Numbers</CardTitle>
            <CardDescription>
              These numbers will be used in the monthly draw
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {scores.map((score, index) => (
                <div 
                  key={score.id}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
                >
                  {score.score}
                </div>
              ))}
              {Array.from({ length: 5 - scores.length }).map((_, index) => (
                <div 
                  key={`empty-${index}`}
                  className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50"
                >
                  ?
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
