"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Trophy, CheckCircle, XCircle, Loader2, Eye, DollarSign, Clock } from "lucide-react"
import { toast } from "sonner"
import type { Winner, Profile, Draw } from "@/lib/types"

interface WinnerWithDetails extends Winner {
  profile: Profile
  draw: Draw
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<WinnerWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWinner, setSelectedWinner] = useState<WinnerWithDetails | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchWinners()
  }, [])

  const fetchWinners = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("winners")
      .select(`
        *,
        profile:profiles(*),
        draw:draws(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to load winners")
      return
    }

    setWinners(data || [])
    setLoading(false)
  }

  const updateVerification = async (winnerId: string, status: "approved" | "rejected") => {
    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("winners")
      .update({ 
        verification_status: status,
        verified_at: status === "approved" ? new Date().toISOString() : null
      })
      .eq("id", winnerId)

    if (error) {
      toast.error("Failed to update verification")
      setSubmitting(false)
      return
    }

    toast.success(`Winner ${status}!`)
    setDialogOpen(false)
    setSubmitting(false)
    fetchWinners()
  }

  const markAsPaid = async (winnerId: string) => {
    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("winners")
      .update({ 
        payout_status: "paid",
        paid_at: new Date().toISOString()
      })
      .eq("id", winnerId)

    if (error) {
      toast.error("Failed to mark as paid")
      setSubmitting(false)
      return
    }

    toast.success("Marked as paid!")
    setSubmitting(false)
    fetchWinners()
  }

  const pendingVerifications = winners.filter(w => w.verification_status === "submitted")
  const approvedPending = winners.filter(w => w.verification_status === "approved" && w.payout_status === "pending")
  const totalPaid = winners.filter(w => w.payout_status === "paid").reduce((sum, w) => sum + Number(w.prize_amount), 0)

  const getStatusBadge = (winner: WinnerWithDetails) => {
    if (winner.payout_status === "paid") {
      return <Badge className="bg-success text-success-foreground">Paid</Badge>
    }
    if (winner.verification_status === "approved") {
      return <Badge className="bg-primary text-primary-foreground">Approved</Badge>
    }
    if (winner.verification_status === "submitted") {
      return <Badge variant="secondary">Pending Review</Badge>
    }
    if (winner.verification_status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>
    }
    return <Badge variant="outline">Awaiting Proof</Badge>
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
        <h1 className="text-3xl font-bold tracking-tight">Winners</h1>
        <p className="text-muted-foreground">
          Verify winners and manage payouts
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Winners</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winners.length}</div>
          </CardContent>
        </Card>

        <Card className={pendingVerifications.length > 0 ? "border-warning" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingVerifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPending.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Winners Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Winners</CardTitle>
          <CardDescription>Review and manage prize winners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Winner</TableHead>
                  <TableHead>Draw</TableHead>
                  <TableHead>Match Type</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map((winner) => (
                  <TableRow key={winner.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{winner.profile?.full_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{winner.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {winner.draw && new Date(winner.draw.draw_date).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{winner.match_type}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${Number(winner.prize_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(winner)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedWinner(winner)
                            setDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {winner.verification_status === "approved" && winner.payout_status === "pending" && (
                          <Button 
                            size="sm"
                            onClick={() => markAsPaid(winner.id)}
                            disabled={submitting}
                          >
                            <DollarSign className="mr-1 h-4 w-4" />
                            Pay
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {winners.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No winners yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Winner Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Winner Details</DialogTitle>
            <DialogDescription>
              Review verification and manage payout
            </DialogDescription>
          </DialogHeader>
          {selectedWinner && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Winner</p>
                  <p className="font-medium">{selectedWinner.profile?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedWinner.profile?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Match Type</p>
                  <Badge variant="outline">{selectedWinner.match_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prize Amount</p>
                  <p className="text-xl font-bold">${Number(selectedWinner.prize_amount).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Verification Status</p>
                {getStatusBadge(selectedWinner)}
              </div>

              {selectedWinner.proof_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Proof Submitted</p>
                  <a 
                    href={selectedWinner.proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Proof
                  </a>
                </div>
              )}

              {selectedWinner.verification_status === "submitted" && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => updateVerification(selectedWinner.id, "approved")}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => updateVerification(selectedWinner.id, "rejected")}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
