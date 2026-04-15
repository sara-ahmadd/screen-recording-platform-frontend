import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AdminCrudTable from "@/components/admin/AdminCrudTable";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function SuperAdminRecordingsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.recordings.list({
        page: 1,
        limit: 100,
        order,
        filters: {
          title: title || undefined,
          status: status || undefined,
          visibility: visibility || undefined,
        },
      });
      setRows(res?.recordings || res?.data || res || []);
    } catch (err: any) {
      toast({ title: "Error loading recordings", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [order, status, title, visibility, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (payload: Record<string, any>) => {
    await superAdminApi.recordings.create(payload);
    toast({ title: "Recording created", description: "Recording was created successfully." });
    await load();
  };
  const onUpdate = async (id: number, payload: Record<string, any>) => {
    await superAdminApi.recordings.update(id, payload);
    toast({ title: "Recording updated", description: "Recording was updated successfully." });
    await load();
  };
  const onDelete = async (id: number) => {
    await superAdminApi.recordings.delete(id);
    await load();
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">All Recordings</h1>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Filter by title" value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-xs" />
          <Input placeholder="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs" />
          <Input placeholder="Filter by visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)} className="max-w-xs" />
          <Select value={order} onValueChange={(v: "ASC" | "DESC") => setOrder(v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Order" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">Newest</SelectItem>
              <SelectItem value="ASC">Oldest</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void load()}>Apply filters</Button>
        </div>
        <AdminCrudTable
          title="Recordings Table"
          rows={rows}
          loading={loading}
          onRefresh={load}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </AppLayout>
  );
}
