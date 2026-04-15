import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SeoManager from "@/components/SeoManager";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfirmDialogProvider } from "@/contexts/ConfirmDialogContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell from "@/components/NotificationsBell";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import VerifyPage from "./pages/Verify";
import ForgotPasswordPage from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import RecordScreen from "./pages/RecordScreen";
import RecordingDetailPage from "./pages/RecordingDetail";
import PublicVideoPage from "./pages/PublicVideo";
import SharePage from "./pages/Share";
import WorkspacesPage from "./pages/Workspaces";
import BillingPage from "./pages/Billing";
import PlansPage from "./pages/Plans";
import SubscriptionPage from "./pages/Subscription";
import NotificationsPage from "./pages/Notifications";
import AcceptInvitePage from "./pages/AcceptInvite";
import SelectWorkspacePage from "./pages/SelectWorkspace";
import ProfilePage from "./pages/Profile";
import SuperAdminRecordingsPage from "./pages/admin/SuperAdminRecordings";
import SuperAdminWorkspacesPage from "./pages/admin/SuperAdminWorkspaces";
import SuperAdminUsersPage from "./pages/admin/SuperAdminUsers";
import SuperAdminPlansPage from "./pages/admin/SuperAdminPlans";
import SuperAdminPromocodesPage from "./pages/admin/SuperAdminPromocodes";
import SuperAdminWorkspaceRecordingsPage from "./pages/admin/SuperAdminWorkspaceRecordings";
import NotFound from "./pages/NotFound";
import RecordScreenCopy from "./pages/RecordScreenCopy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SeoManager />
        <ThemeToggle />
        <ConfirmDialogProvider>
          <AuthProvider>
            <NotificationsBell />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/preview/:token" element={<PublicVideoPage />} />
              <Route path="/share/:shareToken" element={<SharePage />} />
              <Route path="/select-workspace" element={<ProtectedRoute><SelectWorkspacePage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/record" element={<ProtectedRoute><RecordScreen /></ProtectedRoute>} />
              <Route path="/record-copy" element={<ProtectedRoute><RecordScreenCopy /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
              <Route path="/recording/:id" element={<ProtectedRoute><RecordingDetailPage /></ProtectedRoute>} />
              <Route path="/workspaces" element={<ProtectedRoute><WorkspacesPage /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/super-admin/recordings" element={<ProtectedRoute requireSuperAdmin><SuperAdminRecordingsPage /></ProtectedRoute>} />
              <Route path="/super-admin/workspaces" element={<ProtectedRoute requireSuperAdmin><SuperAdminWorkspacesPage /></ProtectedRoute>} />
              <Route path="/super-admin/workspaces/:id/recordings" element={<ProtectedRoute requireSuperAdmin><SuperAdminWorkspaceRecordingsPage /></ProtectedRoute>} />
              <Route path="/super-admin/users" element={<ProtectedRoute requireSuperAdmin><SuperAdminUsersPage /></ProtectedRoute>} />
              <Route path="/super-admin/plans" element={<ProtectedRoute requireSuperAdmin><SuperAdminPlansPage /></ProtectedRoute>} />
              <Route path="/super-admin/promocodes" element={<ProtectedRoute requireSuperAdmin><SuperAdminPromocodesPage /></ProtectedRoute>} />
              <Route path="/accept-invite" element={<AcceptInvitePage />} />
              <Route path="/workspace/accept-invite" element={<AcceptInvitePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ConfirmDialogProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
