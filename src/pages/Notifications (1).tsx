import { useEffect, useState } from "react";
import { notificationsApi } from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2 } from "lucide-react";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await notificationsApi.getAll();
        setNotifications(res.notifications || res.data || res || []);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : notifications.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n: any, i: number) => (
              <Card key={n.id || i} className="glass animate-fade-in">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="gradient-primary rounded-lg p-2 shrink-0 mt-0.5">
                    <Bell className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title || n.message || "Notification"}</p>
                    {n.description && <p className="text-xs text-muted-foreground mt-1">{n.description}</p>}
                    {n.createdAt && <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>}
                  </div>
                  {n.read === false && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
