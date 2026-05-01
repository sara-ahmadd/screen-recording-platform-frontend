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
import { Loader2 } from "lucide-react";

type StatusFilter = "all" | "active" | "canceled" | "past_due" | "pending";
type TypeFilter = "all" | "monthly" | "yearly" | "none";

const PIE_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#22c55e", "#a855f7"];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
      </div>
    </AppLayout>
  );
}
