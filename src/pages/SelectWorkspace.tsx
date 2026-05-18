import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle2 } from "lucide-react";

export default function SelectWorkspacePage() {
  const { t } = useTranslation("workspaces");
  const { user, selectedWorkspaceId, setSelectedWorkspaceId } = useAuth();
  const navigate = useNavigate();

  const workspaces = useMemo(() => user?.workspaces || [], [user?.workspaces]);

  const handleSelectWorkspace = (workspaceId: number) => {
    setSelectedWorkspaceId(String(workspaceId));
    navigate("/dashboard");
  };

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg glass">
          <CardHeader className="text-center">
            <CardTitle>{t("notFound")}</CardTitle>
            <CardDescription>{t("needOne")}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/workspaces")}>{t("goWorkspaces")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">{t("selectTitle")}</h1>
          <p className="text-muted-foreground mt-2">{t("selectSubtitle")}</p>
        </div>

        <div className="grid gap-4">
          {workspaces.map((workspace: any) => {
            const isSelected = String(workspace.id) === selectedWorkspaceId;
            return (
              <Card key={workspace.id} className="glass">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="gradient-primary rounded-lg p-2">
                      <Building2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{workspace.name}</p>
                      <p className="text-sm text-muted-foreground">{workspace.slug}</p>
                    </div>
                  </div>
                  <Button
                    className={isSelected ? "gap-2" : "gradient-primary"}
                    variant={isSelected ? "outline" : "default"}
                    onClick={() => handleSelectWorkspace(workspace.id)}
                  >
                    {isSelected ? <CheckCircle2 className="h-4 w-4" /> : null}
                    {isSelected ? t("continue") : t("selectWorkspace")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
