import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Loader2 } from "lucide-react";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function getEventsRows(res: any): any[] {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.events)) return res.events;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

const eventTypeChartConfig = {
  count: {
    label: "Events",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const trendChartConfig = {
  click: {
    label: "Clicks",
    color: "hsl(var(--chart-1))",
  },
  recording_created: {
    label: "Recording Created",
    color: "hsl(var(--chart-2))",
  },
  recording_completed: {
    label: "Recording Completed",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const pieChartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

export default function SuperAdminAnalyticsVisualsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, eventsRes] = await Promise.all([
        superAdminApi.analytics.overview(),
        superAdminApi.analytics.events({
          page: 1,
          limit: 300,
          order: "DESC",
        }),
      ]);
      setOverview(overviewRes?.data || overviewRes?.overview || overviewRes);
      setEvents(getEventsRows(eventsRes));
    } catch (err: any) {
      toast({
        title: "Failed to load analytics visuals",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const eventTypeData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const key = String(event?.eventType || "unknown");
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  const dailyTrendData = useMemo(() => {
    const rows = new Map<
      string,
      { date: string; click: number; recording_created: number; recording_completed: number }
    >();
    for (const event of events) {
      if (!event?.createdAt || !event?.eventType) continue;
      const date = new Date(event.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      if (!rows.has(date)) {
        rows.set(date, {
          date,
          click: 0,
          recording_created: 0,
          recording_completed: 0,
        });
      }
      const item = rows.get(date);
      if (!item) continue;
      const eventType = String(event.eventType);
      if (eventType === "click") item.click += 1;
      if (eventType === "recording_created") item.recording_created += 1;
      if (eventType === "recording_completed") item.recording_completed += 1;
    }
    return Array.from(rows.values()).reverse();
  }, [events]);

  const completionPieData = useMemo(() => {
    const created = Number(overview?.recordingCreatedEvents ?? 0);
    const completed = Number(overview?.recordingCompletedEvents ?? 0);
    const pending = Math.max(created - completed, 0);
    return [
      { name: "completed", value: completed, fill: "var(--color-completed)" },
      { name: "pending", value: pending, fill: "var(--color-pending)" },
    ];
  }, [overview]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Visuals</h1>
            <p className="text-sm text-muted-foreground">
              High-level platform performance in easy-to-read charts.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Users</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {overview?.totalUsers ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Active Users</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {overview?.activeUsers ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Recordings</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {overview?.totalRecordings ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Events</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {events.length}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Events by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={eventTypeChartConfig} className="h-[320px] w-full">
                    <BarChart data={eventTypeData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="eventType" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recording Completion Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={pieChartConfig} className="h-[320px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <Pie
                        data={completionPieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                      />
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Event Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={trendChartConfig} className="h-[340px] w-full">
                  <LineChart data={dailyTrendData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="click"
                      stroke="var(--color-click)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="recording_created"
                      stroke="var(--color-recording_created)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="recording_completed"
                      stroke="var(--color-recording_completed)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
