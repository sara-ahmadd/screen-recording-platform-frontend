import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Upload, Users, Shield, Zap, ArrowRight, Check, Loader2, CircleCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";
import { authApi, plansApi, setAccessToken, setRefreshToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { isFreePlan } from "@/lib/plans";
import {
  getCurrentWorkspaceSubscription,
  workspaceSubscriptionPlanId,
} from "@/lib/workspaceSubscription";
import { usePaidToFreeSubscribe } from "@/hooks/usePaidToFreeSubscribe";
import { PaidToFreeDialogs } from "@/components/PaidToFreeDialogs";
import { Ad } from "@/components/Ads";
import Logo from "@/components/Logo";
import { useHeaderLinks } from "@/components/PublicPageLayout";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell from "@/components/NotificationsBell";
import { Reveal } from "@/components/Reveal";
import { Badge } from "@/components/Badge";
import HowItWorksSection from "@/components/HowItWorks";
import HomeBlogSection from "@/components/home/HomeBlogSection";
import { TRUST_FOOTER_LINKS } from "@/lib/trustLinks";

export default function Index() {
  const { t } = useTranslation(["home", "common", "auth"]);
  const headerLinks = useHeaderLinks();
  const { user, selectedWorkspaceId, refreshUser, lastAuthError, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paymentSuccessMessage = useMemo(() => {
    const raw = searchParams.get("message");
    if (!raw?.trim()) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [searchParams]);


  const avatarSrc = useAvatarSrc(user?.avatar_url || user?.avatar);
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [googleReady, setGoogleReady] = useState(false);
  const [showGoogleFallback, setShowGoogleFallback] = useState(false);
  const oneTapRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [workspaceRequiredDialogOpen, setWorkspaceRequiredDialogOpen] = useState(false);

  const selectedWorkspace = useMemo(() => {
    if (!user || !selectedWorkspaceId) return null;
    return (user.workspaces || []).find((ws: any) => String(ws.id) === selectedWorkspaceId) || null;
  }, [user, selectedWorkspaceId]);

  const currentWorkspaceSubscription = useMemo(
    () => getCurrentWorkspaceSubscription(selectedWorkspace),
    [selectedWorkspace]
  );

  const currentWorkspacePlanId = useMemo(
    () => workspaceSubscriptionPlanId(currentWorkspaceSubscription),
    [currentWorkspaceSubscription]
  );

  const {
    busyPlanId,
    confirmOpen,
    setConfirmOpen,
    periodDialogOpen,
    handlePeriodDialogOpenChange,
    paidPlanLabel,
    periodEndLabel,
    cancelSuccessMessage,
    confirmLoading,
    requestFreeSubscribe,
    handleConfirmDowngrade,
    handlePeriodDialogContinue,
    cancelDowngradeConfirm,
  } = usePaidToFreeSubscribe();

  const closePaymentDialog = () => {
    setSuccessDialogOpen(false);
    setCancelDialogOpen(false);
    navigate("/", { replace: true });
  };

  const workspaceCount = user?.workspaces?.length ?? 0;
  const hasWorkspaces = workspaceCount > 0;

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await plansApi.getAll();
        setPlans(res.plans || res.data || res || []);
      } catch (err: any) {
        toast({ title: t("home:toast.plansLoadError"), description: err.message, variant: "destructive" });
      } finally {
        setPlansLoading(false);
      }
    }
    loadPlans();
  }, [toast]);

  useEffect(() => {
    const responseMessage = searchParams.get("responseMessage")?.toLowerCase() ?? "";
    if (!responseMessage) {
      setCancelDialogOpen(false);
      setSuccessDialogOpen(false);
      return;
    }
    if (responseMessage.includes("success")) {
      setSuccessDialogOpen(true);
      setCancelDialogOpen(false);
    } else {
      setCancelDialogOpen(true);
      setSuccessDialogOpen(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if ((window as any)?.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const onScriptReady = () => {
      if ((window as any)?.google?.accounts?.id) {
        setGoogleReady(true);
      }
    };

    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      script.addEventListener("load", onScriptReady, { once: true });
      const timeout = window.setTimeout(onScriptReady, 800);
      return () => {
        script.removeEventListener("load", onScriptReady);
        window.clearTimeout(timeout);
      };
    }

    const dynamicScript = document.createElement("script");
    dynamicScript.src = "https://accounts.google.com/gsi/client";
    dynamicScript.async = true;
    dynamicScript.defer = true;
    dynamicScript.onload = onScriptReady;
    document.head.appendChild(dynamicScript);
    return () => {
      dynamicScript.onload = null;
    };
  }, []);

  useEffect(() => {
    const googleApi = (window as any)?.google?.accounts?.id;
    if (loading || user?.email) {
      googleApi?.cancel?.();
      if (oneTapRetryTimeoutRef.current) {
        clearTimeout(oneTapRetryTimeoutRef.current);
        oneTapRetryTimeoutRef.current = null;
      }
      setShowGoogleFallback(false);
      return;
    }
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!googleReady || !googleApi || !clientId) return;

    googleApi.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
      use_fedcm_for_prompt: true,
      callback: async (response: { credential?: string }) => {
        const idToken = response?.credential;
        if (!idToken) return;
        try {
          const res = await authApi.googleOneTap({ idToken });
          const token =
            res?.accessToken || res?.token || res?.data?.accessToken || res?.user?.accessToken;
          const refresh =
            res?.refreshToken || res?.data?.refreshToken || res?.user?.refreshToken;
          if (!token) throw new Error(t("common:googleNoToken"));
          setAccessToken(token);
          if (refresh) setRefreshToken(refresh);
          const meOk = await refreshUser();
          if (!meOk) {
            throw new Error(lastAuthError || t("common:googleSessionFailed"));
          }
          toast({
            variant: "success",
            title: t("home:toast.signedIn"),
            description: t("auth:toast.googleLoginSuccess"),
          });
          navigate("/dashboard");
        } catch (err: any) {
          const errMsg = err?.message || t("common:tryAgain");
          const isInactive = String(errMsg).toLowerCase().includes("inactive");
          toast({
            title: t("auth:toast.googleLoginFailed"),
            description: errMsg,
            variant: "destructive",
          });
          if (isInactive) {
            const emailFromError =
              String(errMsg).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
            const next = emailFromError
              ? `/login?inactive=1&email=${encodeURIComponent(emailFromError)}`
              : "/login?inactive=1";
            navigate(next);
          }
        }
      },
    });
    let retries = 0;
    const promptOneTap = () => {
      googleApi.prompt((notification: any) => {
        const displayed = notification?.isDisplayed?.() === true;
        if (displayed) {
          setShowGoogleFallback(false);
          return;
        }
        const skipped = notification?.isSkippedMoment?.() === true;
        const notDisplayed = notification?.isNotDisplayed?.() === true;
        if (!skipped && !notDisplayed) return;
        setShowGoogleFallback(true);
        const fallbackNode = document.getElementById("google-one-tap-fallback");
        if (fallbackNode) {
          fallbackNode.innerHTML = "";
          googleApi.renderButton(fallbackNode, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
          });
        }
        if (retries < 2) {
          retries += 1;
          oneTapRetryTimeoutRef.current = setTimeout(promptOneTap, 1200);
        }
      });
    };
    promptOneTap();
    return () => {
      if (oneTapRetryTimeoutRef.current) {
        clearTimeout(oneTapRetryTimeoutRef.current);
        oneTapRetryTimeoutRef.current = null;
      }
    };
  }, [googleReady, lastAuthError, loading, navigate, refreshUser, toast, user?.email]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 pt-3 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo imageClassName="h-auto" withText textClassName="text-lg font-bold" />
          </Link>
          <div className="hidden md:flex items-center gap-5">
          {headerLinks?.length > 0 && headerLinks?.map((item) => (
            <Link
            key={item.href}
            to={item.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
                {item.label}
              </Link>
            ))}
            </div>
          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher className="h-9" />
            {user && (
              <>
                <NotificationsBell className="sticky h-9 w-9" />
                <ThemeToggle className="sticky h-9 w-9" />
              </>
            )}
            {user ? (
              <Link to="/profile" className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-2.5 py-1.5 md:px-3">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.user_name || t("common:userAvatar")} loading="lazy" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {user?.user_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="hidden lg:inline max-w-[220px] truncate text-sm text-foreground">{user.email}</span>
              </Link>
            ) : (
              <>
                <ThemeToggle className="static h-9 w-9" />
                <Link to="/login"><Button variant="ghost">{t("common:actions.signIn")}</Button></Link>
                <Link to="/register"><Button className="gradient-primary">{t("common:actions.signUp")}</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <Reveal from="left">
      <section className="max-w-7xl mx-auto px-6 py-14 md:py-10 text-center">
        <Badge className="gradient-primary border-0 mb-6 text-sm px-4 py-1.5 text-primary-foreground">
          <Zap className="h-3.5 w-3.5 me-1" /> {t("home:hero.title")}
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          {t("home:hero.subtitle")}
        </h1>

<p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
  {t("home:hero.description")}
</p>
        <div className="flex items-center justify-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button size="lg" className="gradient-primary gap-2 text-base px-8">
                  {t("home:hero.goDashboard")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/record">
                <Button size="lg" variant="outline" className="text-base px-8">{t("home:hero.startRecording")}</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/demo">
                <Button size="lg" className="gradient-primary gap-2 text-base px-8">
                  {t("home:hero.watchDemo")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/record">
                <Button size="lg" variant="outline" className="text-base px-8">{t("home:hero.startFree")}</Button>
              </Link>
            </>
          )}
        </div>
        
        <p className="mt-4 text-muted-foreground">
          {t("home:hero.browserNote")}
        </p>
       
        {!user && showGoogleFallback && (
          <div className="mt-4 flex justify-center">
            <div id="google-one-tap-fallback" />
          </div>
        )}
        <p className="mt-6 text-sm text-muted-foreground max-w-3xl mx-auto">
          {t("home:hero.privacyBlurb")}{" "}
          <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
            {t("home:hero.privacyLink")}
          </Link>
          .
        </p>
      </section>
      </Reveal>
  {/* Ad here */}
  {/* <!-- landing _top --> */}
      <Ad/>
          {/* How it works */}
<HowItWorksSection/> 
{/* Trust & Security */}
<Reveal from="left">
<section className="max-w-7xl mx-auto px-6 py-14">
  <div className="glass rounded-3xl p-8 md:p-12 overflow-hidden relative">
    
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_top_right,var(--primary)_0%,transparent_40%)]" />

    <div className="relative z-10">
      <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
        {t("home:trust.badge")}
      </Badge>

      <div className="max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          {t("home:trust.title")}
          <span className="gradient-text block mt-2">
            {t("home:trust.titleHighlight")}
          </span>
        </h2>

        <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
          {t("home:trust.subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-12">

        {(
          [
            { titleKey: "home:trust.authTitle", descKey: "home:trust.authDesc" },
            { titleKey: "home:trust.privateTitle", descKey: "home:trust.privateDesc" },
            { titleKey: "home:trust.processingTitle", descKey: "home:trust.processingDesc" },
            { titleKey: "home:trust.minimalTitle", descKey: "home:trust.minimalDesc" },
          ] as const
        ).map((item) => (
          <div
            key={item.titleKey}
            className="rounded-2xl border border-border bg-background/50 p-6 hover:border-primary/30 transition-colors"
          >
            <h3 className="font-semibold text-lg mb-2">{t(item.titleKey)}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
          </div>
        ))}

      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
        <Link
          to="/privacy-policy"
          className="underline underline-offset-4 hover:text-foreground"
        >
          {t("common:nav.privacyPolicy")}
        </Link>

        <Link
          to="/terms-and-conditions"
          className="underline underline-offset-4 hover:text-foreground"
        >
          {t("common:nav.termsConditions")}
        </Link>
      </div>
    </div>
  </div>
</section>
</Reveal>
     {/* Site Overview */}
    <Reveal from="right">
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-14">
        <Badge className="gradient-primary border-0 mb-4 text-primary-foreground px-4 py-1.5">
          {t("home:overview.badge")}
        </Badge>

        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          {t("home:overview.title")}
          <span className="gradient-text block mt-2">
            {t("home:overview.titleHighlight")}
          </span>
        </h2>

        <p className="text-muted-foreground max-w-2xl mx-auto mt-5 text-lg">
          {t("home:overview.subtitle")}
        </p>
      </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {(
              [
                { icon: Zap, titleKey: "home:overview.instantTitle", descKey: "home:overview.instantDesc" },
                { icon: Upload, titleKey: "home:overview.uploadTitle", descKey: "home:overview.uploadDesc" },
                { icon: Users, titleKey: "home:overview.collabTitle", descKey: "home:overview.collabDesc" },
                { icon: Shield, titleKey: "home:overview.privacyTitle", descKey: "home:overview.privacyDesc" },
                { icon: Play, titleKey: "home:overview.playbackTitle", descKey: "home:overview.playbackDesc" },
                { icon: Check, titleKey: "home:overview.workspaceTitle", descKey: "home:overview.workspaceDesc" },
              ] as const
            ).map((item) => (
              <div
                key={item.titleKey}
                className="glass rounded-3xl p-7 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="gradient-primary rounded-2xl p-4 w-fit mb-5">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>

                <h3 className="text-xl font-semibold mb-3">{t(item.titleKey)}</h3>

                <p className="text-muted-foreground leading-relaxed text-sm">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
    </section>
    </Reveal>



{/* Async Communication CTA */}
<Reveal from="left">
<section className="max-w-7xl mx-auto px-6 py-16">
  <div className="glass rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">

    <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_60%)]" />

    <div className="relative z-10">
      <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
        {t("home:async.badge")}
      </Badge>

      <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
        {t("home:async.title")}
        <span className="gradient-text block mt-2">
          {t("home:async.titleHighlight")}
        </span>
      </h2>

      <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
        {t("home:async.subtitle")}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {(
          [
            "home:async.tagDemos",
            "home:async.tagBugs",
            "home:async.tagUpdates",
            "home:async.tagWalkthroughs",
            "home:async.tagOnboarding",
          ] as const
        ).map((key) => (
          <div
            key={key}
            className="rounded-full border border-border bg-background/60 px-4 py-2 text-sm"
          >
            {t(key)}
          </div>
        ))}

      </div>
    </div>
  </div>
</section>
</Reveal>

      <HomeBlogSection />

      {/* Plans */}
      {(plansLoading || plans.length > 0) && (
        <Reveal from="right">
          <section id="plans-section" className="max-w-7xl mx-auto px-6 py-16">
            <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
        {t("home:pricing.title")}
      </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight pb-5">
  {t("home:pricing.subtitle")}
  <span className="gradient-text block mt-2">
    {t("home:pricing.subtitleHighlight")}
  </span>
</h2>
            {plansLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan: any, i: number) => {
              const isPopular = i === 1;
              const free = isFreePlan(plan);
              const isCurrentForWorkspace =
                Boolean(user && selectedWorkspaceId && currentWorkspacePlanId != null && Number(plan.id) === currentWorkspacePlanId);
              const features = [
                plan.maxVideosPerMonth
                  ? t("common:plans.videosPerMonth", { count: plan.maxVideosPerMonth })
                  : null,
                plan.maxVideoDuration
                  ? t("common:plans.minMaxDuration", {
                      min: plan.minVideoDuration || 0,
                      max: plan.maxVideoDuration,
                    })
                  : null,
                plan.maxStorageGB ? t("common:plans.storageGb", { gb: plan.maxStorageGB }) : null,
                plan.maxTeamMembers
                  ? t("common:plans.teamMembers", { count: plan.maxTeamMembers })
                  : null,
                plan.canDownloadVideos ? t("common:plans.videoDownloads") : null,
                plan.canRemoveWaterMark ? t("common:plans.noWatermark") : null,
                plan.canSharePublicLink ? t("common:plans.publicSharing") : null,
                plan.teamAccess ? t("common:plans.teamCollaboration") : null,
              ].filter(Boolean);

                return (
                  <div
                    key={plan.id || plan.name}
                    className={`glass relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 ${
                      isPopular ? "border-primary ring-1 ring-primary/20" : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gradient-primary border-0 text-xs px-3 py-1 text-primary-foreground">
                          <Zap className="h-3 w-3 me-1" /> {t("common:actions.popular")}
                        </Badge>
                      </div>
                    )}

                  <div className="text-center">
                    <h3 className="font-semibold text-lg capitalize">{plan.name || t("home:pricing.planFallback")}</h3>
                    <div className="mt-4 flex flex-col items-center">
                    {/* Primary: EGP */}
                    <div className="text-2xl font-bold">
                      {Number(plan.monthlyPriceEGP).toLocaleString() ?? 0} {t("home:pricing.egp")}{" "}
                      <span className="text-muted-foreground text-base font-normal">{t("home:pricing.perMonth")}</span>
                    </div>

                    {/* Secondary: USD */}
                    <div className="text-sm text-muted-foreground mt-1">
                    {t("home:pricing.usdApprox", {
                      amount: Number(plan.monthlyPriceUSD).toLocaleString() ?? plan.monthlyPrice ?? 0,
                    })}
                    </div>
                  </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("home:pricing.membersUpTo", { count: Number(plan.maxTeamMembers || 0) })}
                    </p>
                    {plan.yearlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("common:yearlySave", {
                          egp: Number(plan.yearlyPriceEGP).toLocaleString(),
                          usd: plan.yearlyPrice,
                          percent: Math.round(
                            (1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100,
                          ),
                        })}
                      </p>
                    )}
                  </div>

                  <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                    {features.slice(0, 8).map((point: any) => (
                      <li key={point as string} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  {isCurrentForWorkspace ? (
                    <Button type="button" className="w-full mt-6" variant="outline" disabled>
                      {t("common:actions.currentPlan")}
                    </Button>
                  ) : free ? (
                    <Button
                      type="button"
                      className={`w-full mt-6 ${isPopular ? "gradient-primary" : ""}`}
                      variant={isPopular ? "default" : "outline"}
                      disabled={busyPlanId === plan.id}
                      onClick={() => {
                        if (!user) {
                          toast({
                            title: t("common:plans.signInRequired"),
                            description: t("home:toast.freePlanSignIn"),
                          });
                          return;
                        }
                        if (!selectedWorkspaceId || !selectedWorkspace) {
                          setWorkspaceRequiredDialogOpen(true);
                          return;
                        }
                        requestFreeSubscribe(plan);
                      }}
                    >
                      {busyPlanId === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("common:actions.getStarted")
                      )}
                    </Button>
                  ) : (
                    <Link
                      to={user ? `/subscription?planId=${plan.id}` : "/login"}
                      className="block mt-6"
                    >
                      <Button
                        className={`w-full ${isPopular ? "gradient-primary" : ""}`}
                        variant={isPopular ? "default" : "outline"}
                      >
                        {t("common:actions.details")}
                      </Button>
                    </Link>
                  )}
                  </div>
                );
              })}
              </div>
            )}
          </section>
        </Reveal>
      )}
{/* <!-- landing_bottom --> */}
    <Ad/>


      {/* FAQ */}
      <Reveal from="right">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
<h2 className="text-3xl md:text-5xl font-bold tracking-tight">
  {t("home:faq.title")}
  <span className="gradient-text block mt-2">
    {t("home:faq.titleHighlight")}
  </span>
</h2>        </div>
        <div className="space-y-4">
        {(
          [
            { qKey: "home:faq.q1", aKey: "home:faq.a1" },
            { qKey: "home:faq.q2", aKey: "home:faq.a2" },
            { qKey: "home:faq.q3", aKey: "home:faq.a3" },
            { qKey: "home:faq.q4", aKey: "home:faq.a4" },
            { qKey: "home:faq.q5", aKey: "home:faq.a5" },
            { qKey: "home:faq.q6", aKey: "home:faq.a6" },
            { qKey: "home:faq.q7", aKey: "home:faq.a7" },
            { qKey: "home:faq.q8", aKey: "home:faq.a8" },
          ] as const
        ).map((item) => (
            <div key={item.qKey} className="glass rounded-2xl p-6 hover:-translate-y-0.5 transition-transform duration-300">
              <h3 className="font-semibold">{t(item.qKey)}</h3>
              <p className="text-sm text-muted-foreground mt-2">{t(item.aKey)}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

     {/* Final CTA */}
<Reveal from="left">
<section className="max-w-7xl mx-auto px-6 pb-24">

  <div className="glass rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden">

    <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_60%)]" />

    <div className="relative z-10">

      {user ? (
        <>
          <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
            {t("home:cta.welcomeBack")}
          </Badge>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            {t("home:cta.continueCreating")}
            <span className="gradient-text block mt-2">
              {t("home:cta.continueHighlight")}
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg">
            {t("home:cta.continueDesc")}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button size="lg" className="gradient-primary">
                {t("home:cta.openDashboard")}
              </Button>
            </Link>

            <Link to="/workspaces">
              <Button size="lg" variant="outline">
                {t("home:cta.manageWorkspaces")}
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
            {t("home:cta.startFree")}
          </Badge>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            {t("home:cta.startRecording")}
            <span className="gradient-text block mt-2">
              {t("home:cta.startHighlight")}
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg max-w-2xl mx-auto">
            {t("home:cta.startDesc")}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gradient-primary">
                {t("home:cta.getStartedFree")}
              </Button>
            </Link>

            <Link to="/login">
              <Button size="lg" variant="outline">
                {t("home:cta.signIn")}
              </Button>
            </Link>
          </div>

         
        </>
      )}

    </div>
  </div>
</section>
</Reveal>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("common:footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-4 text-sm">
            {TRUST_FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(`common:${item.labelKey}`)}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      <Dialog
        open={successDialogOpen}
        onOpenChange={(open) => {
          setSuccessDialogOpen(open);
          if (!open) closePaymentDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left sm:text-center">
              <CircleCheck
                className="h-7 w-7 text-emerald-600 dark:text-emerald-400 shrink-0"
                aria-hidden
              />
              {t("home:dialogs.paymentSuccess")}
            </DialogTitle>
            <DialogDescription>
              {paymentSuccessMessage?.trim() || t("home:dialogs.paymentSuccessDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={closePaymentDialog}>{t("common:actions.confirm")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) closePaymentDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("home:dialogs.paymentCancelled")}</DialogTitle>
            <DialogDescription>{t("home:dialogs.paymentCancelledDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={closePaymentDialog}>{t("common:actions.ok")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={workspaceRequiredDialogOpen}
        onOpenChange={setWorkspaceRequiredDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasWorkspaces
                ? t("home:dialogs.workspaceRequired")
                : t("home:dialogs.createWorkspaceRequired")}
            </DialogTitle>
            <DialogDescription>
              {hasWorkspaces
                ? t("home:dialogs.selectWorkspaceDesc")
                : t("home:dialogs.createWorkspaceDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setWorkspaceRequiredDialogOpen(false)}
            >
              {t("common:actions.cancel")}
            </Button>
            <Link to={hasWorkspaces ? "/select-workspace" : "/workspaces"}>
              <Button onClick={() => setWorkspaceRequiredDialogOpen(false)}>
                {hasWorkspaces
                  ? t("common:workspace.selectWorkspace")
                  : t("common:workspace.createWorkspace")}
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <PaidToFreeDialogs
        confirmOpen={confirmOpen}
        onConfirmOpenChange={setConfirmOpen}
        paidPlanLabel={paidPlanLabel}
        onConfirmCancelSubscription={handleConfirmDowngrade}
        onDismissConfirm={cancelDowngradeConfirm}
        confirmLoading={confirmLoading}
        periodDialogOpen={periodDialogOpen}
        onPeriodDialogOpenChange={handlePeriodDialogOpenChange}
        periodEndLabel={periodEndLabel}
        cancelSuccessMessage={cancelSuccessMessage}
        onPeriodAcknowledge={handlePeriodDialogContinue}
      />
    </div>
  );
}


