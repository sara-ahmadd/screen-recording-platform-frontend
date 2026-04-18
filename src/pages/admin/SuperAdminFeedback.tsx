import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { StarRating } from "@/components/StarRating";

const PAGE_SIZE = 15;

function normalizeRows(res: any): any[] {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.feedback)) return res.feedback;
  if (Array.isArray(res?.feedbacks)) return res.feedbacks;
  return [];
}

export default function SuperAdminFeedbackPage() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [order, setOrder] = useState<"DESC" | "ASC">("DESC");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [successFilter, setSuccessFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await superAdminApi.feedback.overview();
      setOverview(res?.data || res?.overview || res);
    } catch (err: any) {
      toast({ title: "Failed to load feedback overview", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoadingOverview(false);
    }
  }, [toast]);

  const loadRows = useCallback(async () => {
    setLoadingRows(true);
    try {
      const filters: { rating?: number; isWebsiteSuccessful?: boolean } = {};
      if (ratingFilter !== "all") filters.rating = Number(ratingFilter);
      if (successFilter !== "all") filters.isWebsiteSuccessful = successFilter === "true";
      const res = await superAdminApi.feedback.list({
        page,
        limit: PAGE_SIZE,
        order,
        filters: Object.keys(filters).length ? filters : undefined,
      });
      setRows(normalizeRows(res));
    } catch (err: any) {
      toast({ title: "Failed to load feedback list", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoadingRows(false);
    }
  }, [page, order, ratingFilter, successFilter, toast]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Feedback Analytics</h1>

        {loadingOverview ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card><CardHeader><CardTitle className="text-sm">Total Feedback</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.totalFeedback ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Positive</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.positiveFeedback ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Negative</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.negativeFeedback ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Average Rating</CardTitle></CardHeader><CardContent className="flex items-center pt-1"><StarRating value={Number(overview?.averageRating ?? 0)} size="lg" /></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Satisfaction Rate</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.satisfactionRate ?? 0}%</CardContent></Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={String(rating)}>
                      <StarRating value={rating} size="sm" />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={successFilter} onValueChange={setSuccessFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Website success filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All outcomes</SelectItem>
                  <SelectItem value="true">Successful</SelectItem>
                  <SelectItem value="false">Not successful</SelectItem>
                </SelectContent>
              </Select>

              <Select value={order} onValueChange={(value: "DESC" | "ASC") => setOrder(value)}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Newest first</SelectItem>
                  <SelectItem value="ASC">Oldest first</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setPage(1);
                  void loadRows();
                }}
              >
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRatingFilter("all");
                  setSuccessFilter("all");
                  setOrder("DESC");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Successful</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRows ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No feedback found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.userId ?? "-"}</TableCell>
                      <TableCell>
                        <StarRating value={Number(row.rating) || 0} size="sm" />
                      </TableCell>
                      <TableCell>{row.isWebsiteSuccessful ? "Yes" : "No"}</TableCell>
                      <TableCell className="max-w-sm truncate">{row.comment}</TableCell>
                      <TableCell>
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loadingRows}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingRows || rows.length < PAGE_SIZE}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
