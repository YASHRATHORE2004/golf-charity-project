import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Target, 
  Heart, 
  Trophy, 
  Calendar, 
  ArrowRight, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(*), charity:charities(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  // Fetch user's scores (last 5)
  const { data: scores } = await supabase
    .from("golf_scores")
    .select("*")
    .eq("user_id", user.id)
    .order("played_date", { ascending: false })
    .limit(5)

  // Fetch user's winnings
  const { data: winnings } = await supabase
    .from("winners")
    .select("*, draw:draws(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch upcoming draw
  const { data: upcomingDraw } = await supabase
    .from("draws")
    .select("*")
    .eq("status", "pending")
    .order("draw_date", { ascending: true })
    .limit(1)
    .single()

  // Calculate total winnings
  const totalWinnings = winnings?.reduce((sum, w) => sum + Number(w.prize_amount), 0) || 0

  const scoresCount = scores?.length || 0
  const scoresProgress = (scoresCount / 5) * 100

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your GolfCharity overview.
        </p>
      </div>

      {/* Subscription Alert */}
      {!subscription && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">No Active Subscription</h3>
              <p className="text-sm text-muted-foreground">
                Subscribe to enter monthly draws and support your favorite charity.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/subscribe">
                Subscribe Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            {subscription ? (
              <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription?.plan?.name || "None"}
            </div>
            {subscription && (
              <p className="text-xs text-muted-foreground">
                Renews {new Date(subscription.renewal_date || "").toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Golf Scores</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scoresCount}/5</div>
            <Progress value={scoresProgress} className="mt-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {scoresCount < 5 ? `${5 - scoresCount} more scores needed` : "Ready for draws!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalWinnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {winnings?.length || 0} prize{winnings?.length !== 1 ? "s" : ""} won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Charity Support</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscription?.charity_percentage || 10}%</div>
            <p className="text-xs text-muted-foreground">
              {subscription?.charity?.name || "No charity selected"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Scores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Scores</CardTitle>
              <CardDescription>Your last 5 golf scores</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/scores">
                Manage Scores
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {scores && scores.length > 0 ? (
              <div className="space-y-3">
                {scores.map((score, index) => (
                  <div key={score.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                        {score.score}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Score #{index + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(score.played_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Stableford</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No scores entered yet</p>
                <Button variant="outline" size="sm" asChild className="mt-4">
                  <Link href="/dashboard/scores">Add Your First Score</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Draw */}
        <Card>
          <CardHeader>
            <CardTitle>Next Draw</CardTitle>
            <CardDescription>Monthly prize draw information</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDraw ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {new Date(upcomingDraw.draw_date).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric"
                      })} Draw
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Draw date: {new Date(upcomingDraw.draw_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Prize Pool</p>
                    <p className="text-xl font-bold">${Number(upcomingDraw.total_pool).toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Jackpot</p>
                    <p className="text-xl font-bold text-accent">${Number(upcomingDraw.jackpot_amount).toFixed(2)}</p>
                  </div>
                </div>

                {scoresCount >= 5 && subscription ? (
                  <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-sm text-success">You&apos;re entered in this draw!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3">
                    <Clock className="h-5 w-5 text-warning" />
                    <span className="text-sm text-warning">
                      {!subscription ? "Subscribe to enter" : "Enter 5 scores to participate"}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No upcoming draws scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Winnings */}
      {winnings && winnings.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Winnings</CardTitle>
              <CardDescription>Your prize history</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/winnings">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {winnings.slice(0, 3).map((win) => (
                <div key={win.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                      <Trophy className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{win.match_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(win.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(win.prize_amount).toFixed(2)}</p>
                    <Badge variant={win.payout_status === "paid" ? "default" : "secondary"}>
                      {win.payout_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
