import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { workspaceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function SuperAdminWorkspaceRecordingsPage() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await workspaceApi.recordings(Number(id));
      const raw = res?.recordings ?? res?.data ?? res;
      setRecordings(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      setRecordings([]);
      toast({
        title: "Failed to load workspace recordings",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workspace Recordings</h1>
            <p className="text-sm text-muted-foreground mt-1">Workspace ID: {id || "N/A"}</p>
          </div>
          <Link to="/super-admin/workspaces">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workspaces
            </Button>
          </Link>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle>All recordings for this workspace</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recordings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No recordings found for this workspace.
              </p>
            ) : (
              <div className="rounded-xl border border-border/80 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordings.map((rec: any) => (
                      <TableRow key={rec?.id || JSON.stringify(rec)}>
                        <TableCell>{rec?.id ?? "-"}</TableCell>
                        <TableCell>{rec?.title || "-"}</TableCell>
                        <TableCell className="capitalize">{rec?.status || "-"}</TableCell>
                        <TableCell className="capitalize">{rec?.visibility || "-"}</TableCell>
                        <TableCell>
                          {rec?.createdAt ? new Date(rec.createdAt).toLocaleString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
