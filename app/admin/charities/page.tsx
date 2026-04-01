"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Heart, Plus, Edit, Trash2, Loader2, DollarSign, Star } from "lucide-react"
import { toast } from "sonner"
import type { Charity } from "@/lib/types"

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCharity, setEditingCharity] = useState<Charity | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchCharities()
  }, [])

  const fetchCharities = async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("charities")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to load charities")
      return
    }

    setCharities(data || [])
    setLoading(false)
  }

  const openCreateDialog = () => {
    setEditingCharity(null)
    setName("")
    setDescription("")
    setWebsiteUrl("")
    setIsFeatured(false)
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEditDialog = (charity: Charity) => {
    setEditingCharity(charity)
    setName(charity.name)
    setDescription(charity.description || "")
    setWebsiteUrl(charity.website_url || "")
    setIsFeatured(charity.is_featured)
    setIsActive(charity.is_active)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    const charityData = {
      name,
      description,
      website_url: websiteUrl || null,
      is_featured: isFeatured,
      is_active: isActive
    }

    if (editingCharity) {
      const { error } = await supabase
        .from("charities")
        .update(charityData)
        .eq("id", editingCharity.id)

      if (error) {
        toast.error("Failed to update charity")
        setSubmitting(false)
        return
      }
      toast.success("Charity updated!")
    } else {
      const { error } = await supabase
        .from("charities")
        .insert(charityData)

      if (error) {
        toast.error("Failed to create charity")
        setSubmitting(false)
        return
      }
      toast.success("Charity created!")
    }

    setDialogOpen(false)
    setSubmitting(false)
    fetchCharities()
  }

  const deleteCharity = async (charityId: string) => {
    if (!confirm("Are you sure you want to delete this charity?")) return

    const supabase = createClient()
    
    const { error } = await supabase
      .from("charities")
      .delete()
      .eq("id", charityId)

    if (error) {
      toast.error("Failed to delete charity")
      return
    }

    toast.success("Charity deleted")
    fetchCharities()
  }

  const totalReceived = charities.reduce((sum, c) => sum + Number(c.total_received), 0)

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
          <h1 className="text-3xl font-bold tracking-tight">Charities</h1>
          <p className="text-muted-foreground">
            Manage charity partners and listings
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Charity
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charities</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{charities.length}</div>
            <p className="text-xs text-muted-foreground">
              {charities.filter(c => c.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{charities.filter(c => c.is_featured).length}</div>
            <p className="text-xs text-muted-foreground">
              Highlighted on homepage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All-time contributions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charities List */}
      <div className="grid gap-4 md:grid-cols-2">
        {charities.map((charity) => (
          <Card key={charity.id} className={!charity.is_active ? "opacity-60" : ""}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{charity.name}</h3>
                    {charity.is_featured && (
                      <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                    )}
                    {!charity.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {charity.description || "No description"}
                  </p>
                  <p className="mt-2 text-sm font-medium text-primary">
                    ${Number(charity.total_received).toFixed(2)} received
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(charity)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteCharity(charity.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {charities.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No Charities Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first charity partner
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCharity ? "Edit Charity" : "Add Charity"}</DialogTitle>
            <DialogDescription>
              {editingCharity ? "Update charity details" : "Add a new charity partner"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Charity name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the charity's mission"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Featured</Label>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCharity ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
