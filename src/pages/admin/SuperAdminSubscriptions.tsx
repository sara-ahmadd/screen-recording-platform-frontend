import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppLayout from "@/components/AppLayout";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StatusFilter = "all" | "active" | "canceled" | "past_due" | "pending";
type TypeFilter = "all" | "monthly" | "yearly" | "none";

const PIE_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#22c55e", "#a855f7"];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function SuperAdminSubscriptionsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [statsByStatus, setStatsByStatus] = useState<any[]>([]);
  const [statsByDate, setStatsByDate] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [debouncedFilters, setDebouncedFilters] = useState({
    status: "all" as StatusFilter,
    type: "all" as TypeFilter,
    dateFrom: "",
    dateTo: "",
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRow, setDetailRow] = useState<any | null>(null);
  const [detailPayload, setDetailPayload] = useState<{
    subscription?: any;
    nextPlanName?: string | null;
    simulationAllowed?: boolean;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({
        status: statusFilter,
        type: typeFilter,
        dateFrom,
        dateTo,
      });
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await superAdminApi.subscriptions.list({
          page,
          limit,
          ...(debouncedFilters.status !== "all"
            ? { status: debouncedFilters.status }
            : {}),
          ...(debouncedFilters.type !== "all"
            ? { type: debouncedFilters.type }
            : {}),
          ...(debouncedFilters.dateFrom
            ? { dateFrom: debouncedFilters.dateFrom }
            : {}),
          ...(debouncedFilters.dateTo ? { dateTo: debouncedFilters.dateTo } : {}),
        });
        const payload = res || {};
        if (cancelled) return;
        setRows(Array.isArray(payload?.data) ? payload.data : []);
        setStatsByStatus(payload?.stats?.byStatus || []);
        setStatsByDate(payload?.stats?.byDate || []);
        setTotalPages(Math.max(1, Number(payload?.totalPages || 1)));
      } catch (err: any) {
        if (cancelled) return;
        toast({
          title: "Failed to load subscriptions",
          description: err?.message || "Unexpected error",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [page, limit, debouncedFilters, toast]);

  const statusChartData = useMemo(
    () =>
      (statsByStatus || []).map((item: any) => ({
        name: String(item.status || "unknown"),
        value: Number(item.count || 0),
      })),
    [statsByStatus],
  );

  const openDetail = async (row: any) => {
    setDetailRow(row);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailPayload(null);
    try {
      const res = await superAdminApi.subscriptions.adminDetails(Number(row.id));
      setDetailPayload({
        subscription: res?.subscription,
        nextPlanName: res?.nextPlanName ?? null,
        simulationAllowed: Boolean(res?.simulationAllowed),
      });
    } catch (err: any) {
      toast({
        title: "Could not load subscription",
        description: err?.message || "Unexpected error",
        variant: "destructive",
      });
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!detailRow?.id) return;
    setDetailLoading(true);
    try {
      const res = await superAdminApi.subscriptions.adminDetails(
        Number(detailRow.id),
      );
      setDetailPayload({
        subscription: res?.subscription,
        nextPlanName: res?.nextPlanName ?? null,
        simulationAllowed: Boolean(res?.simulationAllowed),
      });
    } catch (err: any) {
      toast({
        title: "Refresh failed",
        description: err?.message || "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const runSimulateRenewal = async () => {
    if (!detailRow?.id) return;
    try {
      const res = await superAdminApi.subscriptions.simulateRenewal(
        Number(detailRow.id),
      );
      toast({
        title: res?.duplicate
          ? "Replay skipped (idempotent)"
          : "Renewal simulated successfully",
        description: res?.message || "OK",
      });
      await refreshDetail();
      setDetailRow((r: any) => ({ ...r, ...res?.subscription }));
    } catch (err: any) {
      toast({
        title: "Simulation failed",
        description: err?.message || "Unexpected error",
        variant: "destructive",
      });
    }
  };

  const runSimulateFailure = async () => {
    if (!detailRow?.id) return;
    try {
      const res = await superAdminApi.subscriptions.simulateRenewalFailure(
        Number(detailRow.id),
      );
      toast({
        title: "Failure state applied",
        description: res?.message || "OK",
      });
      await refreshDetail();
    } catch (err: any) {
      toast({
        title: "Simulation failed",
        description: err?.message || "Unexpected error",
        variant: "destructive",
      });
    }
  };

  const runRefund = async () => {
    if (!detailRow?.id) return;
    const amountRaw = window.prompt("Refund amount (leave empty for full):", "");
    const reasonRaw = window.prompt("Refund reason (optional):", "admin_refund");
    const amount =
      amountRaw != null && amountRaw.trim() !== ""
        ? Number(amountRaw)
        : undefined;
    try {
      const res = await superAdminApi.subscriptions.refund(Number(detailRow.id), {
        ...(amount != null && Number.isFinite(amount) && amount > 0
          ? { amount }
          : {}),
        ...(reasonRaw && reasonRaw.trim() ? { reason: reasonRaw.trim() } : {}),
      });
      toast({
        title: "Refund submitted",
        description: res?.message || "OK",
      });
      await refreshDetail();
    } catch (err: any) {
      toast({
        title: "Refund failed",
        description: err?.message || "Unexpected error",
        variant: "destructive",
      });
    }
  };

  const dateChartData = useMemo(
    () =>
      (statsByDate || []).map((item: any) => ({
        date: String(item.date || ""),
        count: Number(item.count || 0),
      })),
    [statsByDate],
  );

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Super Admin Subscriptions</h1>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v: StatusFilter) => setStatusFilter(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v: TypeFilter) => setTypeFilter(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Date from"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Date to"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>By Status</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {statusChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Subscriptions Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dateChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-border/80 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead className="w-[100px]">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No subscriptions found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row: any) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              {row?.user?.user_name || "Unknown"} ({row?.user?.email || "—"})
                            </TableCell>
                            <TableCell className="capitalize">{row.status || "—"}</TableCell>
                            <TableCell className="capitalize">
                              {String(row.type || "") === "null" ? "none" : row.type || "—"}
                            </TableCell>
                            <TableCell>{formatDate(row.currentPeriodStart)}</TableCell>
                            <TableCell>{formatDate(row.currentPeriodEnd)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void openDetail(row)}
                              >
                                Open
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Subscription #{detailRow?.id != null ? detailRow.id : "—"}
              </DialogTitle>
            </DialogHeader>
            {detailLoading && !detailPayload ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border border-border/80 p-3 space-y-1.5">
                  <p className="font-medium">Billing period</p>
                  <p>
                    <span className="text-muted-foreground">Current plan: </span>
                    {detailPayload?.subscription?.plan?.name ?? "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Period start: </span>
                    {formatDateTime(
                      detailPayload?.subscription?.currentPeriodStart,
                    )}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Period end: </span>
                    {formatDateTime(
                      detailPayload?.subscription?.currentPeriodEnd,
                    )}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Next billing: </span>
                    {formatDateTime(
                      detailPayload?.subscription?.nextBillingDate,
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 p-3 space-y-1.5">
                  <p className="font-medium">Retries &amp; errors</p>
                  <p>
                    <span className="text-muted-foreground">Last attempt: </span>
                    {formatDateTime(
                      detailPayload?.subscription?.lastBillingAttemptAt,
                    )}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Retry count: </span>
                    {detailPayload?.subscription?.billingRetryCount ?? 0}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Last error: </span>
                    {detailPayload?.subscription?.lastBillingError || "—"}
                  </p>
                </div>

                {Boolean(detailPayload?.subscription?.changeAtPeriodEnd) &&
                detailPayload?.nextPlanName ? (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
                    Scheduled downgrade to{" "}
                    <strong>{detailPayload.nextPlanName}</strong> at{" "}
                    {formatDateTime(
                      detailPayload?.subscription?.currentPeriodEnd,
                    )}
                  </div>
                ) : null}

                <div className="rounded-lg border border-border/80 p-3 space-y-2">
                  <p className="font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Testing أدوات (Admin Only)
                  </p>
                  {!detailPayload?.simulationAllowed ? (
                    <p className="text-muted-foreground text-xs">
                      Simulation is disabled (production requires{" "}
                      <code className="text-xs bg-muted px-1 rounded">
                        PAYMOB_RECURRING_SIMULATION_ENABLED=true
                      </code>
                      ).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void runSimulateRenewal()}
                        disabled={detailLoading}
                      >
                        Simulate renewal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void runSimulateFailure()}
                        disabled={detailLoading}
                      >
                        Simulate failure
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void runRefund()}
                        disabled={detailLoading}
                      >
                        Refund payment
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
