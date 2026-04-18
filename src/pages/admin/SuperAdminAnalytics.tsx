import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 15;

function getEventsRows(res: any): any[] {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.events)) return res.events;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

export default function SuperAdminAnalyticsPage() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventType, setEventType] = useState<string>("all");
  const [order, setOrder] = useState<"DESC" | "ASC">("DESC");
  const [page, setPage] = useState(1);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const res = await superAdminApi.analytics.overview();
      setOverview(res?.data || res?.overview || res);
    } catch (err: any) {
      toast({ title: "Failed to load analytics overview", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoadingOverview(false);
    }
  }, [toast]);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await superAdminApi.analytics.events({
        page,
        limit: PAGE_SIZE,
        order,
        filters: eventType === "all" ? undefined : { eventType },
      });
      setEvents(getEventsRows(res));
    } catch (err: any) {
      toast({ title: "Failed to load analytics events", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoadingEvents(false);
    }
  }, [page, order, eventType, toast]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Analytics Overview</h1>

        {loadingOverview ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardHeader><CardTitle className="text-sm">Total Users</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.totalUsers ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Active Users</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.activeUsers ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Currently Logged In</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.currentlyLoggedInUsers ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Total Recordings</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.totalRecordings ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Total Clicks</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.totalClicks ?? 0}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Recordings Completed Events</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{overview?.recordingCompletedEvents ?? 0}</CardContent></Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Analytics Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All event types</SelectItem>
                  <SelectItem value="click">click</SelectItem>
                  <SelectItem value="recording_created">recording_created</SelectItem>
                  <SelectItem value="recording_completed">recording_completed</SelectItem>
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
                  void loadEvents();
                }}
              >
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEventType("all");
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
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEvents ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event: any) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.id}</TableCell>
                      <TableCell>{event.userId ?? "-"}</TableCell>
                      <TableCell>{event.eventType}</TableCell>
                      <TableCell>{event.eventName}</TableCell>
                      <TableCell className="max-w-sm truncate">
                        {event.metadata ? JSON.stringify(event.metadata) : "-"}
                      </TableCell>
                      <TableCell>
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : "-"}
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
                disabled={page <= 1 || loadingEvents}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingEvents || events.length < PAGE_SIZE}
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
