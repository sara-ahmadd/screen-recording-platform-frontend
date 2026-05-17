import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { headerLinks } from "@/components/PublicPageLayout";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsBell from "@/components/NotificationsBell";
import { Reveal } from "@/components/Reveal";
import { Badge } from "@/components/Badge";
import HowItWorksSection from "@/components/HowItWorks";

export default function Index() {
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
        toast({ title: "Error loading plans", description: err.message, variant: "destructive" });
      } finally {
        setPlansLoading(false);
      }
    }
    loadPlans();
  }, [toast]);

  useEffect(() => {
    //detect : responseMessage=3DS+authentication+failed or responseMessage=Cancelled+by+User or responseMessage=Success
    const responseMessage = searchParams.get("responseMessage")?.toLowerCase()??"";
    if(!responseMessage){
      setCancelDialogOpen(false);
      setSuccessDialogOpen(false);
      return};
    try{if (responseMessage?.includes('success')) {
      setSuccessDialogOpen(true);
      setCancelDialogOpen(false);
    } else if (!responseMessage?.includes('success')) {
      setCancelDialogOpen(true);
      setSuccessDialogOpen(false);
    }}finally{
       setCancelDialogOpen(false);
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
          if (!token) throw new Error("Google sign-in did not return access token.");
          setAccessToken(token);
          if (refresh) setRefreshToken(refresh);
          const meOk = await refreshUser();
          if (!meOk) {
            throw new Error(lastAuthError || "Could not verify Google session.");
          }
          toast({
            variant: "success",
            title: "Signed in",
            description: "Google login successful.",
          });
          navigate("/dashboard");
        } catch (err: any) {
          const errMsg = err?.message || "Please try again.";
          const isInactive = String(errMsg).toLowerCase().includes("inactive");
          toast({
            title: "Google login failed",
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
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
            {user && (
              <>
                <NotificationsBell className="sticky h-9 w-9" />
                <ThemeToggle className="sticky h-9 w-9" />
              </>
            )}
            {user ? (
              <Link to="/profile" className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-2.5 py-1.5 md:px-3">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.user_name || "User avatar"} loading="lazy" className="h-7 w-7 rounded-full object-cover" />
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
                <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
                <Link to="/register"><Button className="gradient-primary">SignUp</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <Reveal from="left">
      <section className="max-w-6xl mx-auto px-6 py-14 md:py-10 text-center">
        <Badge className="gradient-primary border-0 mb-6 text-sm px-4 py-1.5 text-primary-foreground">
          <Zap className="h-3.5 w-3.5 mr-1" /> Screen Recording Made Simple
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
  Record your screen,<br/> share videos instantly,<br />
  <span className="gradient-text">and collaborate with your team.</span>
</h1>

<p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
  theRec is a browser-based screen recording and video collaboration platform built for async communication, tutorials, product demos, and team collaboration.
</p>
        <div className="flex items-center justify-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button size="lg" className="gradient-primary gap-2 text-base px-8">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/record">
                <Button size="lg" variant="outline" className="text-base px-8">Start Recording</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/demo">
                <Button size="lg" className="gradient-primary gap-2 text-base px-8">
                  Watch Demo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/record">
                <Button size="lg" variant="outline" className="text-base px-8">Start Recording free</Button>
              </Link>
            </>
          )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
  No download required • Works in your browser • Free plan available
</p>
        {!user && showGoogleFallback && (
          <div className="mt-4 flex justify-center">
            <div id="google-one-tap-fallback" />
          </div>
        )}
        <p className="mt-6 text-sm text-muted-foreground max-w-3xl mx-auto">
          theRec is the official website for recording your screen, uploading videos, and collaborating with your workspace team.
          To use core features, we request account/profile information and recording metadata only to authenticate users,
          organize workspaces, process videos, and enable secure sharing.
          Read our full policy here:{" "}
          <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
      </Reveal>
  {/* Ad here */}
  {/* <!-- landing _top --> */}
      <Ad/>
      
     {/* Product Overview */}
    <Reveal from="right">
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-14">
        <Badge className="gradient-primary border-0 mb-4 text-primary-foreground px-4 py-1.5">
          Product Overview
        </Badge>

        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          Everything your team needs
          <span className="gradient-text block mt-2">
            to communicate with video
          </span>
        </h2>

        <p className="text-muted-foreground max-w-2xl mx-auto mt-5 text-lg">
          theRec helps teams record, explain, share, and collaborate asynchronously —
          without meetings, complicated tools, or downloads.
        </p>
      </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Instant Browser Recording",
                desc: "Start recording immediately with no installation required. Capture your screen, tab, or window directly from your browser.",
              },
              {
                icon: Upload,
                title: "Upload Existing Videos",
                desc: "Already have recordings? Upload and organize them inside your workspace in seconds.",
              },
              {
                icon: Users,
                title: "Async Team Collaboration",
                desc: "Share visual updates instead of scheduling meetings. Keep communication faster and clearer.",
              },
              {
                icon: Shield,
                title: "Privacy & Access Control",
                desc: "Keep recordings private, workspace-only, or publicly shareable with secure links.",
              },
              {
                icon: Play,
                title: "Fast Video Playback",
                desc: "Videos are processed automatically for smooth streaming and instant viewing.",
              },
              {
                icon: Check,
                title: "Workspace Organization",
                desc: "Manage recordings, teammates, permissions, and collaboration from one central place.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="glass rounded-3xl p-7 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="gradient-primary rounded-2xl p-4 w-fit mb-5">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>

                <h3 className="text-xl font-semibold mb-3">
                  {item.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
    </section>
    </Reveal>

      {/* Google verification info */}
{/* Trust & Security */}
<Reveal from="left">
<section className="max-w-6xl mx-auto px-6 py-14">
  <div className="glass rounded-3xl p-8 md:p-12 overflow-hidden relative">
    
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_top_right,var(--primary)_0%,transparent_40%)]" />

    <div className="relative z-10">
      <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
        Trust & Security
      </Badge>

      <div className="max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          Built with transparency,
          <span className="gradient-text block mt-2">
            privacy, and secure collaboration
          </span>
        </h2>

        <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
          theRec is designed for modern teams that need secure video communication,
          protected workspace collaboration, and reliable recording infrastructure.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-12">

        {[
          {
            title: "Secure Authentication",
            desc: "Protected login, workspace access control, and secure account authentication across your organization.",
          },
          {
            title: "Private Video Access",
            desc: "Control who can access recordings using workspace permissions or secure shareable links.",
          },
          {
            title: "Automated Video Processing",
            desc: "Videos are automatically optimized for playback, streaming, thumbnails, and organization.",
          },
          {
            title: "Minimal Data Collection",
            desc: "We only collect essential account and recording data necessary to operate the platform.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-background/50 p-6 hover:border-primary/30 transition-colors"
          >
            <h3 className="font-semibold text-lg mb-2">
              {item.title}
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}

      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
        <Link
          to="/privacy-policy"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Privacy Policy
        </Link>

        <Link
          to="/terms-and-conditions"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Terms & Conditions
        </Link>
      </div>
    </div>
  </div>
</section>
</Reveal>

     {/* How it works */}
<HowItWorksSection/>


{/* Async Communication CTA */}
<Reveal from="left">
<section className="max-w-6xl mx-auto px-6 py-16">
  <div className="glass rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">

    <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_60%)]" />

    <div className="relative z-10">
      <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
        Async Communication
      </Badge>

      <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
        Replace long meetings
        <span className="gradient-text block mt-2">
          with quick video updates
        </span>
      </h2>

      <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
        Share product demos, bug reports, tutorials, onboarding videos,
        and team updates without interrupting everyone's schedule.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">

        {[
          "Product demos",
          "Bug reporting",
          "Team updates",
          "Client walkthroughs",
          "Async onboarding",
        ].map((item) => (
          <div
            key={item}
            className="rounded-full border border-border bg-background/60 px-4 py-2 text-sm"
          >
            {item}
          </div>
        ))}

      </div>
    </div>
  </div>
</section>
</Reveal>




      {/* Plans */}
      {(plansLoading || plans.length > 0) && (
        <Reveal from="right">
          <section id="plans-section" className="max-w-6xl mx-auto px-6 py-16">
            <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
        Pricing
      </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight pb-5">
  Flexible pricing for
  <span className="gradient-text block mt-2">
    individuals and teams
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
                plan.maxVideosPerMonth ? `${plan.maxVideosPerMonth} videos/month` : null,
                plan.maxVideoDuration ? `${plan.maxVideoDuration} min max duration` : null,
                plan.maxStorageGB ? `${plan.maxStorageGB} GB storage` : null,
                plan.maxTeamMembers ? `${plan.maxTeamMembers} team members` : null,
                plan.canDownloadVideos ? "Video downloads" : null,
                plan.canRemoveWaterMark ? "No watermark" : null,
                plan.canSharePublicLink ? "Public sharing" : null,
                plan.teamAccess ? "Team collaboration" : null,
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
                          <Zap className="h-3 w-3 mr-1" /> Popular
                        </Badge>
                      </div>
                    )}

                  <div className="text-center">
                    <h3 className="font-semibold text-lg capitalize">{plan.name || "Plan"}</h3>
                    <div className="mt-4 flex flex-col items-center">
                    {/* Primary: EGP */}
                    <div className="text-3xl font-bold">
                      {Number(plan.monthlyPriceEGP).toLocaleString() ?? 0} EGP
                      <span className="text-muted-foreground text-base font-normal">/mo</span>
                    </div>

                    {/* Secondary: USD */}
                    <div className="text-sm text-muted-foreground mt-1">
                    ≈  {Number(plan.monthlyPriceUSD).toLocaleString() ?? plan.monthlyPrice ?? 0} USD /mo
                    </div>
                  </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Up to {Number(plan.maxTeamMembers || 0)} members
                    </p>
                    {plan.yearlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                       ({Number(plan.yearlyPriceEGP).toLocaleString()} EGP ≈  ${plan.yearlyPrice}USD) /year  (save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
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
                      Current plan
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
                            title: "Sign in required",
                            description: "Please sign in to subscribe to the free plan.",
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
                        "Get Started"
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
                        Details
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
     {/* Testimonials */}
<Reveal from="left">
<section className="max-w-6xl mx-auto px-6 py-24">

  <div className="text-center mb-14">
    <Badge className="gradient-primary border-0 mb-4 text-primary-foreground px-4 py-1.5">
      Testimonials
    </Badge>

    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
      Trusted by modern
      <span className="gradient-text block mt-2">
        remote-first teams
      </span>
    </h2>

    <p className="text-muted-foreground mt-5 text-lg max-w-2xl mx-auto">
      Teams use theRec to reduce meetings, explain faster,
      and collaborate more efficiently with video.
    </p>
  </div>

  <div className="grid md:grid-cols-3 gap-6">

    {[
      {
        quote:
          "theRec completely changed how our product team communicates updates asynchronously.",
        name: "Aya O.",
        role: "Product Manager",
      },
      {
        quote:
          "We replaced many internal meetings with quick recordings and saved hours every week.",
        name: "Karim M.",
        role: "Engineering Lead",
      },
      {
        quote:
          "Support explanations became much clearer after switching to video walkthroughs.",
        name: "Lina S.",
        role: "Customer Success",
      },
    ].map((item) => (
      <div
        key={item.name}
        className="glass rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300"
      >
        <div className="text-5xl leading-none text-primary/20 mb-5">
          "
        </div>

        <p className="text-muted-foreground leading-relaxed">
          {item.quote}
        </p>

        <div className="mt-8">
          <p className="font-semibold">
            {item.name}
          </p>

          <p className="text-sm text-muted-foreground">
            {item.role}
          </p>
        </div>
      </div>
    ))}

  </div>
</section>
</Reveal>

      {/* FAQ */}
      <Reveal from="right">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
<h2 className="text-3xl md:text-5xl font-bold tracking-tight">
  Questions?
  <span className="gradient-text block mt-2">
    We’ve got answers
  </span>
</h2>        </div>
        <div className="space-y-4">
        {[
  {
    q: "What is theRec used for?",
    a: "theRec helps individuals and teams record their screen, explain ideas visually, share video updates, and collaborate asynchronously without unnecessary meetings.",
  },
  {
    q: "Do I need to install any software?",
    a: "No. theRec works directly in your browser, so you can start recording instantly without downloading or installing anything.",
  },
  {
    q: "Can I share recordings with people outside my workspace?",
    a: "Yes. You can generate secure public links for external sharing or keep videos private inside your workspace.",
  },
  {
    q: "Is theRec suitable for remote teams?",
    a: "Absolutely. theRec is built for async communication, making it ideal for remote teams, distributed companies, product demos, onboarding, and team updates.",
  },
  {
    q: "How are videos processed after recording?",
    a: "Videos are automatically processed in the background to generate optimized playback formats, thumbnails, and streaming-ready files.",
  },
  {
    q: "Can I upload existing videos?",
    a: "Yes. In addition to screen recording, you can upload existing video files and organize them inside your workspace.",
  },
  {
    q: "Are recordings private and secure?",
    a: "Yes. You control who can access recordings through workspace permissions and secure sharing settings.",
  },
  {
    q: "Is there a free plan available?",
    a: "Yes. You can start with a free plan and upgrade anytime when your team needs more storage, collaboration, and advanced features.",
  },
].map((item) => (
            <div key={item.q} className="glass rounded-2xl p-6 hover:-translate-y-0.5 transition-transform duration-300">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="text-sm text-muted-foreground mt-2">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

     {/* Final CTA */}
<Reveal from="left">
<section className="max-w-6xl mx-auto px-6 pb-24">

  <div className="glass rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden">

    <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_60%)]" />

    <div className="relative z-10">

      {user ? (
        <>
          <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
            Welcome Back
          </Badge>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Continue creating
            <span className="gradient-text block mt-2">
              and collaborating
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg">
            Jump back into your workspace and manage your recordings.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button size="lg" className="gradient-primary">
                Open Dashboard
              </Button>
            </Link>

            <Link to="/workspaces">
              <Button size="lg" variant="outline">
                Manage Workspaces
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <Badge className="gradient-primary border-0 mb-5 text-primary-foreground px-4 py-1.5">
            Start Free
          </Badge>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Start recording
            <span className="gradient-text block mt-2">
              in less than a minute
            </span>
          </h2>

          <p className="text-muted-foreground mt-6 text-lg max-w-2xl mx-auto">
            Create your workspace, record your screen,
            and collaborate with your team — directly from the browser.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gradient-primary">
                Get Started Free
              </Button>
            </Link>

            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>

          <p className="text-base text-muted-foreground mt-5">
            No credit card required
          </p>
        </>
      )}

    </div>
  </div>
</section>
</Reveal>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} theRec. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/blogs" className="text-muted-foreground hover:text-foreground transition-colors">
              Blogs
            </Link>
          </div>
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
              Payment successful
            </DialogTitle>
            <DialogDescription>
              {paymentSuccessMessage?.trim() ||
                "Your payment was completed successfully and your subscription is now active."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={closePaymentDialog}>Confirm</Button>
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
            <DialogTitle>Payment Cancelled</DialogTitle>
            <DialogDescription>
              Your payment was cancelled. You can try again anytime from the plans section.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={closePaymentDialog}>OK</Button>
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
              {hasWorkspaces ? "Select a workspace first" : "Create a workspace first"}
            </DialogTitle>
            <DialogDescription>
              {hasWorkspaces
                ? "To continue with the free plan, please select a workspace."
                : "You do not have any workspaces yet. Create one to continue with the free plan."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setWorkspaceRequiredDialogOpen(false)}
            >
              Cancel
            </Button>
            <Link to={hasWorkspaces ? "/select-workspace" : "/workspaces"}>
              <Button onClick={() => setWorkspaceRequiredDialogOpen(false)}>
                {hasWorkspaces ? "Select Workspace" : "Create Workspace"}
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


