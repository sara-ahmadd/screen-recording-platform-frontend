import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RouteRecord } from "vite-react-ssg";
import { HelmetProvider } from "react-helmet-async";
import { Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SeoManager from "@/components/SeoManager";
import { AuthProvider } from "@/contexts/AuthContext";
import { VideoCountWarningProvider } from "@/contexts/VideoCountWarningContext";
import { SubscriptionRenewal3dsProvider } from "@/contexts/SubscriptionRenewal3dsContext";
import { ConfirmDialogProvider } from "@/contexts/ConfirmDialogContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import FeedbackPage from "./pages/Feedback";
import AcceptInvitePage from "./pages/AcceptInvite";
import SelectWorkspacePage from "./pages/SelectWorkspace";
import ProfilePage from "./pages/Profile";
import PrivacyPolicyPage from "./pages/PrivacyPolicy";
import TermsAndConditionsPage from "./pages/TermsAndConditions";
import ContactPage from "./pages/Contact";
import AboutPage from "./pages/About";
import BlogsPage from "./pages/Blogs";
import SuperAdminRecordingsPage from "./pages/admin/SuperAdminRecordings";
import SuperAdminWorkspacesPage from "./pages/admin/SuperAdminWorkspaces";
import SuperAdminUsersPage from "./pages/admin/SuperAdminUsers";
import SuperAdminPlansPage from "./pages/admin/SuperAdminPlans";
import SuperAdminPromocodesPage from "./pages/admin/SuperAdminPromocodes";
import SuperAdminWorkspaceRecordingsPage from "./pages/admin/SuperAdminWorkspaceRecordings";
import SuperAdminAnalyticsPage from "./pages/admin/SuperAdminAnalytics";
import SuperAdminFeedbackPage from "./pages/admin/SuperAdminFeedback";
import SuperAdminAnalyticsVisualsPage from "./pages/admin/SuperAdminAnalyticsVisuals";
import SuperAdminSubscriptionsPage from "./pages/admin/SuperAdminSubscriptions";
import SuperAdminPaymobPlansPage from "./pages/admin/SuperAdminPaymobPlans";
import NotFound from "./pages/NotFound";
import RecordScreenCopy from "./pages/RecordScreenCopy";
import PaymentSuccessPage from "./pages/PaymentSuccess";
import PaymentFailedPage from "./pages/PaymentFailed";
import CheckoutReviewPage from "./pages/CheckoutReview";

const queryClient = new QueryClient();

const RootLayout = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SeoManager />
        <ConfirmDialogProvider>
          <AuthProvider>
            <VideoCountWarningProvider>
              <SubscriptionRenewal3dsProvider>
                <Outlet />
              </SubscriptionRenewal3dsProvider>
            </VideoCountWarningProvider>
          </AuthProvider>
        </ConfirmDialogProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Index /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "verify", element: <VerifyPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "preview/:token", element: <PublicVideoPage /> },
      { path: "share/:shareToken", element: <SharePage /> },
      { path: "accept-invite", element: <AcceptInvitePage /> },
      { path: "workspace/accept-invite", element: <AcceptInvitePage /> },
      { path: "privacy-policy", element: <PrivacyPolicyPage /> },
      { path: "terms-and-conditions", element: <TermsAndConditionsPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "blogs", element: <BlogsPage /> },
      { path: "select-workspace", element: <ProtectedRoute><SelectWorkspacePage /></ProtectedRoute> },
      { path: "dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: "record", element: <ProtectedRoute><RecordScreen /></ProtectedRoute> },
      { path: "record-copy", element: <ProtectedRoute><RecordScreenCopy /></ProtectedRoute> },
      { path: "upload", element: <ProtectedRoute><UploadPage /></ProtectedRoute> },
      { path: "recording/:id", element: <ProtectedRoute><RecordingDetailPage /></ProtectedRoute> },
      { path: "workspaces", element: <ProtectedRoute><WorkspacesPage /></ProtectedRoute> },
      { path: "billing", element: <ProtectedRoute><BillingPage /></ProtectedRoute> },
      { path: "plans", element: <ProtectedRoute><PlansPage /></ProtectedRoute> },
      { path: "subscription", element: <ProtectedRoute><SubscriptionPage /></ProtectedRoute> },
      { path: "checkout/review", element: <ProtectedRoute><CheckoutReviewPage /></ProtectedRoute> },
      { path: "notifications", element: <ProtectedRoute><NotificationsPage /></ProtectedRoute> },
      { path: "feedback", element: <ProtectedRoute><FeedbackPage /></ProtectedRoute> },
      { path: "profile", element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: "payment/success", element: <PaymentSuccessPage /> },
      { path: "payment/failed", element: <PaymentFailedPage /> },
      {
        path: "super-admin/recordings",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminRecordingsPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/workspaces",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminWorkspacesPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/workspaces/:id/recordings",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminWorkspaceRecordingsPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/users",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminUsersPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/plans",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminPlansPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/promocodes",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminPromocodesPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/analytics",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminAnalyticsPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/analytics-visuals",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminAnalyticsVisualsPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/feedback",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminFeedbackPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/subscriptions",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminSubscriptionsPage /></ProtectedRoute>,
      },
      {
        path: "super-admin/paymob-plans",
        element: <ProtectedRoute requireSuperAdmin><SuperAdminPaymobPlansPage /></ProtectedRoute>,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];
