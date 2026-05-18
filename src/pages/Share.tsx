import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { recordingsApi } from "@/lib/api";
import { Loader2, Play, Monitor } from "lucide-react";

export default function SharePage() {
  const { t } = useTranslation(["errors", "common"]);
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!shareToken) {
        setError(t("invalidShare"));
        setLoading(false);
        return;
      }
      try {
        const res = await recordingsApi.previewLink(shareToken);
        setData(res.recording || res);
      } catch (err: any) {
        setError(err.message || t("videoNotFound"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shareToken, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Play className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <Link to="/" className="max-w-[95%] mx-auto flex items-center gap-2">
          <div className="gradient-primary rounded-lg p-1.5">
            <Monitor className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">{t("common:brand")}</span>
        </Link>
      </header>
      <main className="max-w-[95%] mx-auto p-6">
        <div className="aspect-video bg-secondary/30 rounded-xl overflow-hidden mb-4">
          {data?.videoUrl ? (
            <video
              src={data.videoUrl}
              controls
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold">{data?.title || t("sharedRecording")}</h1>
        {data?.createdAt && (
          <p className="text-sm text-muted-foreground mt-1">
            {t("sharedOn", { date: new Date(data.createdAt).toLocaleDateString() })}
          </p>
        )}
      </main>
    </div>
  );
}
