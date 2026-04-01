"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Trophy, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import type { Draw, DrawEntry, GolfScore } from "@/lib/types"

interface DrawWithEntry extends Draw {
  entry?: DrawEntry
}

export default function DrawsPage() {
  const [draws, setDraws] = useState<DrawWithEntry[]>([])
  const [scores, setScores] = useState<GolfScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const [drawsRes, entriesRes, scoresRes] = await Promise.all([
      supabase.from("draws").select("*").order("draw_date", { ascending: false }),
      supabase.from("draw_entries").select("*").eq("user_id", user.id),
      supabase.from("golf_scores").select("*").eq("user_id", user.id).order("played_date", { ascending: false }).limit(5)
    ])

    if (drawsRes.data && entriesRes.data) {
      const drawsWithEntries = drawsRes.data.map(draw => ({
        ...draw,
        entry: entriesRes.data.find(e => e.draw_id === draw.id)
      }))
      setDraws(drawsWithEntries)
    }
    
    if (scoresRes.data) setScores(scoresRes.data)
    setLoading(false)
  }

  const upcomingDraws = draws.filter(d => d.status === "pending")
  const pastDraws = draws.filter(d => d.status === "published")

  const getMatchCount = (entryNumbers: number[], winningNumbers: number[]) => {
    return entryNumbers.filter(n => winningNumbers.includes(n)).length
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Draws</h1>
        <p className="text-muted-foreground">
          View upcoming and past monthly prize draws
        </p>
      </div>

      {/* Your Entry Numbers */}
      <Card>
        <CardHeader>
          <CardTitle>Your Entry Numbers</CardTitle>
          <CardDescription>Based on your last 5 golf scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {scores.map((score) => (
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
          {scores.length < 5 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Add {5 - scores.length} more score{5 - scores.length !== 1 ? "s" : ""} to participate in draws
            </p>
          )}
        </CardContent>
      </Card>

      {/* Draws Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingDraws.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Results ({pastDraws.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingDraws.length > 0 ? (
            upcomingDraws.map((draw) => (
              <Card key={draw.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                        <Calendar className="h-7 w-7 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {new Date(draw.draw_date).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric"
                          })} Draw
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Draw date: {new Date(draw.draw_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="rounded-lg bg-muted/50 px-4 py-2 text-center">
                        <p className="text-xs text-muted-foreground">Prize Pool</p>
                        <p className="text-lg font-bold">${Number(draw.total_pool).toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg bg-accent/10 px-4 py-2 text-center">
                        <p className="text-xs text-muted-foreground">Jackpot</p>
                        <p className="text-lg font-bold text-accent">${Number(draw.jackpot_amount).toFixed(2)}</p>
                      </div>
                    </div>

                    <div>
                      {scores.length >= 5 ? (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Entered
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Need {5 - scores.length} scores
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No upcoming draws scheduled</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastDraws.length > 0 ? (
            pastDraws.map((draw) => {
              const matchCount = draw.entry 
                ? getMatchCount(draw.entry.entry_numbers, draw.winning_numbers)
                : 0
              const isWinner = matchCount >= 3

              return (
                <Card key={draw.id} className={isWinner ? "border-accent" : ""}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {new Date(draw.draw_date).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric"
                              })} Draw
                            </h3>
                            {isWinner && (
                              <Badge className="bg-accent text-accent-foreground">
                                <Trophy className="mr-1 h-3 w-3" />
                                Winner!
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Drawn on {new Date(draw.published_at || draw.draw_date).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <div className="rounded-lg bg-muted/50 px-4 py-2 text-center">
                            <p className="text-xs text-muted-foreground">Total Pool</p>
                            <p className="text-lg font-bold">${Number(draw.total_pool).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Winning Numbers */}
                      <div>
                        <p className="text-sm font-medium mb-2">Winning Numbers</p>
                        <div className="flex flex-wrap gap-2">
                          {draw.winning_numbers.map((num, i) => (
                            <div
                              key={i}
                              className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                                draw.entry?.entry_numbers.includes(num)
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Your Numbers */}
                      {draw.entry && (
                        <div>
                          <p className="text-sm font-medium mb-2">Your Numbers</p>
                          <div className="flex flex-wrap gap-2">
                            {draw.entry.entry_numbers.map((num, i) => (
                              <div
                                key={i}
                                className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                                  draw.winning_numbers.includes(num)
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {num}
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {matchCount} number{matchCount !== 1 ? "s" : ""} matched
                          </p>
                        </div>
                      )}

                      {!draw.entry && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          You did not participate in this draw
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No past draws yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
