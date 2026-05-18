import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
      toast({ title: t("feedback.loadFailed"), description: err?.message, variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadMyFeedback();
  }, [loadMyFeedback]);

  const handleCreate = async () => {
    if (form.comment.trim().length < 5) {
      toast({ title: t("feedback.commentTooShort"), description: t("feedback.commentTooShortDesc"), variant: "destructive" });
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
      toast({ title: t("feedback.submitted"), description: t("feedback.submittedDesc") });
      await loadMyFeedback();
    } catch (err: any) {
      toast({ title: t("feedback.submitFailed"), description: err?.message, variant: "destructive" });
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
      toast({ title: t("feedback.updated"), description: t("feedback.updatedDesc") });
      setEditing(null);
      await loadMyFeedback();
    } catch (err: any) {
      toast({ title: t("feedback.updateFailed"), description: err?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: t("feedback.deleteConfirm"),
      description: t("confirm.description"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });
    if (!ok) return;
    try {
      await feedbackApi.delete(id);
      toast({ title: t("feedback.deleted") });
      await loadMyFeedback();
    } catch (err: any) {
      toast({ title: t("feedback.deleteFailed"), description: err?.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">{t("feedback.title")}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t("feedback.submitTitle")}</CardTitle>
            <CardDescription>{t("feedback.submitDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("feedback.rating")}</Label>
                <Select
                  value={String(form.rating)}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, rating: Number(value) }))}
                >
                  <SelectTrigger><SelectValue placeholder={t("feedback.selectRating")} /></SelectTrigger>
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
                <Label>{t("feedback.websiteSuccessful")}</Label>
                <Select
                  value={form.isWebsiteSuccessful ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, isWebsiteSuccessful: value === "true" }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("feedback.yes")}</SelectItem>
                    <SelectItem value="false">{t("feedback.no")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("feedback.comment")}</Label>
              <Textarea
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                rows={5}
                placeholder={t("feedback.commentPlaceholder")}
              />
            </div>
            <Button className="gradient-primary" onClick={() => void handleCreate()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("feedback.submit")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("feedback.myFeedback")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("feedback.rating")}</TableHead>
                  <TableHead>{t("feedback.successful")}</TableHead>
                  <TableHead>{t("feedback.comment")}</TableHead>
                  <TableHead>{t("feedback.date")}</TableHead>
                  <TableHead className="text-right">{t("feedback.actionsCol")}</TableHead>
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
                      {t("feedback.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <StarRating value={Number(row.rating) || 0} size="sm" />
                      </TableCell>
                      <TableCell>{row.isWebsiteSuccessful ? t("feedback.yes") : t("feedback.no")}</TableCell>
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
            <DialogTitle>{t("feedback.editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("feedback.rating")}</Label>
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
              <Label>{t("feedback.websiteSuccessfulShort")}</Label>
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
                  <SelectItem value="true">{t("feedback.yes")}</SelectItem>
                  <SelectItem value="false">{t("feedback.no")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("feedback.comment")}</Label>
              <Textarea
                value={editForm.comment}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>{t("actions.cancel")}</Button>
              <Button className="gradient-primary" onClick={() => void handleUpdate()}>
                {t("actions.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
