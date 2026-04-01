import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Heart, Trophy, TrendingUp, Calendar, Clock, CheckCircle } from "lucide-react"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch all stats
  const [
    usersRes,
    subscriptionsRes,
    charitiesRes,
    winnersRes,
    drawsRes,
    contributionsRes,
    prizePoolRes
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.from("subscriptions").select("id, status", { count: "exact" }).eq("status", "active"),
    supabase.from("charities").select("id, total_received"),
    supabase.from("winners").select("id, prize_amount, verification_status, payout_status"),
    supabase.from("draws").select("*").order("draw_date", { ascending: false }).limit(5),
    supabase.from("charity_contributions").select("amount"),
    supabase.from("prize_pool_config").select("*").single()
  ])

  const totalUsers = usersRes.count || 0
  const activeSubscriptions = subscriptionsRes.count || 0
  const totalCharityContributions = contributionsRes.data?.reduce((sum, c) => sum + Number(c.amount), 0) || 0
  const pendingVerifications = winnersRes.data?.filter(w => w.verification_status === "submitted").length || 0
  const totalPrizesPaid = winnersRes.data?.filter(w => w.payout_status === "paid").reduce((sum, w) => sum + Number(w.prize_amount), 0) || 0

  const recentDraws = drawsRes.data || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of the Golf Charity Platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Charity Contributions</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCharityContributions.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total donated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prizes Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPrizesPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total paid out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {pendingVerifications > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Pending Verifications</h3>
              <p className="text-sm text-muted-foreground">
                {pendingVerifications} winner{pendingVerifications !== 1 ? "s" : ""} awaiting verification
              </p>
            </div>
            <Badge variant="secondary">{pendingVerifications} pending</Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Draws */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Draws
            </CardTitle>
            <CardDescription>Latest prize draw activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDraws.length > 0 ? (
              <div className="space-y-3">
                {recentDraws.map((draw) => (
                  <div key={draw.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">
                        {new Date(draw.draw_date).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric"
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pool: ${Number(draw.total_pool).toFixed(2)}
                      </p>
                    </div>
                    <Badge variant={
                      draw.status === "published" ? "default" :
                      draw.status === "simulation" ? "secondary" : "outline"
                    }>
                      {draw.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No draws yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Prize Pool Distribution
            </CardTitle>
            <CardDescription>Current configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">5-Number Match (Jackpot)</span>
                <Badge className="bg-accent text-accent-foreground">
                  {prizePoolRes.data?.five_match_percentage || 40}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">4-Number Match</span>
                <Badge variant="secondary">
                  {prizePoolRes.data?.four_match_percentage || 35}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">3-Number Match</span>
                <Badge variant="secondary">
                  {prizePoolRes.data?.three_match_percentage || 25}%
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm font-medium">Contribution per Sub</span>
                <span className="font-bold">${prizePoolRes.data?.contribution_per_subscription || 10}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
