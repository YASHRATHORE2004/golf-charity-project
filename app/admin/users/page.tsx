"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Users, Search, Loader2, Eye, Shield, ShieldOff } from "lucide-react"
import { toast } from "sonner"
import type { Profile, Subscription, GolfScore } from "@/lib/types"

interface UserWithDetails extends Profile {
  subscription?: Subscription
  scores?: GolfScore[]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const supabase = createClient()
    
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to load users")
      return
    }

    // Fetch subscriptions and scores for each user
    const usersWithDetails = await Promise.all(
      (profiles || []).map(async (profile) => {
        const [subRes, scoresRes] = await Promise.all([
          supabase.from("subscriptions").select("*").eq("user_id", profile.id).eq("status", "active").single(),
          supabase.from("golf_scores").select("*").eq("user_id", profile.id).order("played_date", { ascending: false }).limit(5)
        ])
        
        return {
          ...profile,
          subscription: subRes.data || undefined,
          scores: scoresRes.data || []
        }
      })
    )

    setUsers(usersWithDetails)
    setLoading(false)
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !currentStatus })
      .eq("id", userId)

    if (error) {
      toast.error("Failed to update admin status")
      return
    }

    toast.success(`User ${!currentStatus ? "promoted to" : "removed from"} admin`)
    fetchUsers()
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage user accounts and subscriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users ({users.length})
              </CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Scores</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.subscription ? (
                        <Badge className="bg-success text-success-foreground">Active</Badge>
                      ) : (
                        <Badge variant="secondary">None</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.scores?.length || 0}/5</Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Badge variant="destructive">Admin</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user)
                            setDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={user.is_admin ? "destructive" : "default"}
                          onClick={() => toggleAdmin(user.id, user.is_admin)}
                        >
                          {user.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and manage user information
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedUser.full_name || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant={selectedUser.is_admin ? "destructive" : "outline"}>
                    {selectedUser.is_admin ? "Admin" : "User"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Golf Scores ({selectedUser.scores?.length || 0}/5)</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.scores?.map((score) => (
                    <Badge key={score.id} variant="secondary" className="text-lg py-1 px-3">
                      {score.score}
                    </Badge>
                  ))}
                  {(!selectedUser.scores || selectedUser.scores.length === 0) && (
                    <p className="text-sm text-muted-foreground">No scores entered</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Subscription</p>
                {selectedUser.subscription ? (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge className="bg-success text-success-foreground">Active</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active subscription</p>
                )}
              </div>
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
