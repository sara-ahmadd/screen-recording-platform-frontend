import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { feedbackApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { StarRating } from "@/components/StarRating";

type FeedbackForm = {
  rating: number;
  comment: string;
  isWebsiteSuccessful: boolean;
};

const defaultForm: FeedbackForm = {
  rating: 5,
  comment: "",
  isWebsiteSuccessful: true,
};

export default function FeedbackPage() {
  const { toast } = useToast();
  const confirm = useConfirmDialog();
  const [form, setForm] = useState<FeedbackForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<FeedbackForm>(defaultForm);

  const loadMyFeedback = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await feedbackApi.getMy({ page: 1, limit: 20, order: "DESC" });
      setRows(res?.data || res?.feedback || res?.feedbacks || []);
    } catch (err: any) {
      toast({ title: "Failed to load feedback", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadMyFeedback();
  }, [loadMyFeedback]);

  const handleCreate = async () => {
    if (form.comment.trim().length < 5) {
      toast({ title: "Comment too short", description: "Comment must be at least 5 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.create({
        rating: form.rating,
        comment: form.comment.trim(),
        isWebsiteSuccessful: form.isWebsiteSuccessful,
      });
      setForm(defaultForm);
      toast({ title: "Feedback submitted", description: "Thanks for your feedback." });
      await loadMyFeedback();
    } catch (err: any) {
      toast({ title: "Failed to submit feedback", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setEditForm({
      rating: Number(row?.rating || 5),
      comment: String(row?.comment || ""),
      isWebsiteSuccessful: Boolean(row?.isWebsiteSuccessful),
    });
  };

  const handleUpdate = async () => {
    if (!editing?.id) return;
    try {
      await feedbackApi.update(Number(editing.id), editForm);
      toast({ title: "Feedback updated", description: "Your feedback has been updated." });
      setEditing(null);
      await loadMyFeedback();
    } catch (err: any) {
      toast({ title: "Failed to update feedback", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Delete feedback?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      await feedbackApi.delete(id);
      toast({ title: "Feedback deleted" });
      await loadMyFeedback();
    } catch (err: any) {
      toast({ title: "Failed to delete feedback", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Feedback</h1>

        <Card>
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
            <CardDescription>Share your experience with the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select
                  value={String(form.rating)}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, rating: Number(value) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        <StarRating value={value} size="sm" />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Was the website successful for you?</Label>
                <Select
                  value={form.isWebsiteSuccessful ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, isWebsiteSuccessful: value === "true" }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                rows={5}
                placeholder="Tell us what worked and what can be improved..."
              />
            </div>
            <Button className="gradient-primary" onClick={() => void handleCreate()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rating</TableHead>
                  <TableHead>Successful</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingList ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No feedback submitted yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <StarRating value={Number(row.rating) || 0} size="sm" />
                      </TableCell>
                      <TableCell>{row.isWebsiteSuccessful ? "Yes" : "No"}</TableCell>
                      <TableCell className="max-w-sm truncate">{row.comment}</TableCell>
                      <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => void handleDelete(Number(row.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select
                value={String(editForm.rating)}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, rating: Number(value) }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      <StarRating value={value} size="sm" />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Website successful</Label>
              <Select
                value={editForm.isWebsiteSuccessful ? "true" : "false"}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    isWebsiteSuccessful: value === "true",
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Textarea
                value={editForm.comment}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="gradient-primary" onClick={() => void handleUpdate()}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
