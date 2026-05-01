import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Upload, Users, CreditCard, Bell, LogOut, Video, PanelLeftClose, PanelLeftOpen, Shield, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell from "@/components/NotificationsBell";

const baseNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/record", icon: Video, label: "Record" },
  { href: "/upload", icon: Upload, label: "Upload" },
  { href: "/workspaces", icon: Users, label: "Workspaces" },
  { href: "/billing", icon: CreditCard, label: "Billing" },
  { href: "/feedback", icon: MessageSquare, label: "Feedback" },
];

const superAdminNavItems = [
  { href: "/super-admin/recordings", icon: Shield, label: "All Recordings" },
  { href: "/super-admin/workspaces", icon: Shield, label: "All Workspaces" },
  { href: "/super-admin/users", icon: Shield, label: "All Users" },
  { href: "/super-admin/plans", icon: Shield, label: "All Plans" },
  { href: "/super-admin/promocodes", icon: Shield, label: "All Promocodes" },
  { href: "/super-admin/analytics", icon: Shield, label: "Analytics Overview" },
  { href: "/super-admin/analytics-visuals", icon: Shield, label: "Analytics Visuals" },
  { href: "/super-admin/subscriptions", icon: Shield, label: "Subscriptions" },
  { href: "/super-admin/feedback", icon: Shield, label: "All Feedback" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const isSuperAdmin = String(user?.role || "").toLowerCase() === "superadmin";
  const navItems = user
    ? [
        ...baseNavItems,
        ...(isSuperAdmin ? superAdminNavItems : []),
        { href: "/notifications", icon: Bell, label: "Notifications" },
      ]
    : baseNavItems;
  const confirm = useConfirmDialog();
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const rawSidebarAvatarUrl = useMemo(() => user?.avatar_url || user?.avatar || "", [user?.avatar_url, user?.avatar]);
  const sidebarAvatarUrl = useAvatarSrc(rawSidebarAvatarUrl);
  useEffect(() => {
    setAvatarFailed(false);
  }, [sidebarAvatarUrl, rawSidebarAvatarUrl]);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Sign out?",
      description: "You will need to login again to continue.",
      confirmText: "Sign out",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 overflow-y-auto flex",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo imageClassName="h-auto" withText textClassName="text-lg font-bold text-sidebar-foreground" />
          </Link>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-sidebar-foreground"
            onClick={() => setIsSidebarOpen(false)}
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className={cn(
              "w-full flex items-center gap-3 mb-6 rounded-lg p-2 -m-2 text-left transition-colors",
              location.pathname === "/profile"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "hover:bg-sidebar-accent text-sidebar-foreground"
            )}
          >
            {sidebarAvatarUrl && !avatarFailed ? (
              <img
                src={sidebarAvatarUrl}
                alt={user.user_name || "User avatar"}
                loading="lazy"
                className="h-8 w-8 rounded-full object-cover border border-sidebar-border"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {user?.user_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.user_name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
          </button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:text-white" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2 mt-3" /> Sign out
          </Button>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all",
          isSidebarOpen ? "md:ml-64" : "md:ml-0"
        )}
      >
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className={`flex h-16 items-center ${isSidebarOpen ? 'justify-end' : 'justify-between'} px-4 md:px-6`}>
           {!isSidebarOpen&& <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setIsSidebarOpen((v) => !v)}
                aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
              <Link to="/" className="flex min-w-0 items-center gap-2">
                <Logo imageClassName="h-auto" withText textClassName="font-bold" />
              </Link>
            </div>}
            <div className="flex items-center gap-2">
              <NotificationsBell className="sticky h-9 w-9" />
              <ThemeToggle className="sticky h-9 w-9" />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
