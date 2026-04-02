"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Trophy, Upload, Loader2, CheckCircle, Clock, DollarSign, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Winner } from "@/lib/types"

export default function WinningsPage() {
  const [winnings, setWinnings] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWin, setSelectedWin] = useState<Winner | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchWinnings()
  }, [])

  const fetchWinnings = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data, error } = await supabase
      .from("winners")
      .select("*, draw:draws(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to load winnings")
      return
    }

    setWinnings(data || [])
    setLoading(false)
  }

const handleUploadProof = async (file: File) => {
    if (!selectedWin) return

    // Validate file type and size (max 5MB)
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be less than 5MB")
      return
    }

    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error("Please log in")
      setUploading(false)
      return
    }

    try {
      // Create a unique file name to prevent overwriting
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${selectedWin.id}-${Date.now()}.${fileExt}`

      // 1. Upload to Supabase Storage (Bucket name: 'proofs')
      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(fileName)

      // 2. Update the winners table with the real URL
      const { error: updateError } = await supabase
        .from("winners")
        .update({ 
          proof_url: publicUrl,
          verification_status: "submitted"
        })
        .eq("id", selectedWin.id)

      if (updateError) throw updateError

      toast.success("Proof uploaded successfully! Admin will review shortly.")
      setDialogOpen(false)
      fetchWinnings()
    } catch (error: any) {
      toast.error(error.message || "Failed to upload proof")
    } finally {
      setUploading(false)
    }
  }

  const totalWinnings = winnings.reduce((sum, w) => sum + Number(w.prize_amount), 0)
  const paidWinnings = winnings.filter(w => w.payout_status === "paid").reduce((sum, w) => sum + Number(w.prize_amount), 0)
  const pendingWinnings = winnings.filter(w => w.payout_status === "pending").reduce((sum, w) => sum + Number(w.prize_amount), 0)

  const getStatusBadge = (win: Winner) => {
    if (win.payout_status === "paid") {
      return <Badge className="bg-success text-success-foreground"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>
    }
    if (win.verification_status === "approved") {
      return <Badge className="bg-primary text-primary-foreground"><Clock className="mr-1 h-3 w-3" /> Processing Payment</Badge>
    }
    if (win.verification_status === "submitted") {
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Under Review</Badge>
    }
    if (win.verification_status === "rejected") {
      return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> Rejected</Badge>
    }
    return <Badge variant="outline"><Upload className="mr-1 h-3 w-3" /> Proof Required</Badge>
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
        <h1 className="text-3xl font-bold tracking-tight">Winnings</h1>
        <p className="text-muted-foreground">
          View and manage your prize winnings
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalWinnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {winnings.length} prize{winnings.length !== 1 ? "s" : ""} won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${paidWinnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Successfully received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">${pendingWinnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification/payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Winnings List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Prizes</CardTitle>
          <CardDescription>All your winning entries and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {winnings.length > 0 ? (
            <div className="space-y-4">
              {winnings.map((win) => (
                <div key={win.id} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                      <Trophy className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{win.match_type}</p>
                        {getStatusBadge(win)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {win.draw && new Date(win.draw.draw_date).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric"
                        })} Draw
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold">${Number(win.prize_amount).toFixed(2)}</p>
                      {win.paid_at && (
                        <p className="text-xs text-muted-foreground">
                          Paid on {new Date(win.paid_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {win.verification_status === "pending" && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedWin(win)
                          setDialogOpen(true)
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Proof
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No Winnings Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep entering your scores for a chance to win!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Winner Verification Process</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Upload a screenshot of your golf scorecard showing the winning scores</li>
            <li>Admin reviews your submission (usually within 24-48 hours)</li>
            <li>Once approved, payment is processed to your registered account</li>
            <li>You&apos;ll receive an email confirmation when payment is sent</li>
          </ol>
        </CardContent>
      </Card>

      {/* Upload Proof Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Score Proof</DialogTitle>
            <DialogDescription>
              Upload a screenshot of your golf scores from the platform to verify your win.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadProof(file)
              }}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={uploading}>Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
