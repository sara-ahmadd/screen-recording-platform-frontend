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
    //detect : responseMessage=3DS+authentication+failed
    const responseMessage = searchParams.get("responseMessage")?.toLowerCase();
    if (!responseMessage.includes('failed')&&!responseMessage.includes('cancelled')) {
      setSuccessDialogOpen(true);
      setCancelDialogOpen(false);
    } else if (responseMessage.includes('failed')||responseMessage.includes('cancelled')) {
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
                <Link to="/register"><Button className="gradient-primary">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <Reveal from="left">
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
        <Badge className="gradient-primary border-0 mb-6 text-sm px-4 py-1.5 text-primary-foreground">
          <Zap className="h-3.5 w-3.5 mr-1" /> Screen Recording Made Simple
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
  Say it once.<br />
  <span className="gradient-text">Share it forever.</span>
</h1>

<p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
  Record your screen, explain ideas faster, and replace endless meetings with simple video messages. 
  Built for teams who move fast.
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
              <Link to="/register">
                <Button size="lg" className="gradient-primary gap-2 text-base px-8">
                  Start Recording <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-base px-8">Sign In</Button>
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
      {/* Features */}
      <Reveal from="right">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
  {
    icon: Zap,
    title: "Record in seconds",
    desc: "Start recording instantly with no setup or downloads."
  },
  {
    icon: Users,
    title: "Explain instead of typing",
    desc: "Send video messages that save hours of meetings and long texts."
  },
  {
    icon: Shield,
    title: "Control who sees what",
    desc: "Share privately with your team or generate secure public links."
  }
].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-8 text-center hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
              <div className="gradient-primary rounded-2xl p-4 w-fit mx-auto mb-4">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      {/* Google verification info */}
<Reveal from="left">
  <section className="max-w-6xl mx-auto px-6 py-8 md:py-12">
    <div className="glass rounded-2xl p-6 md:p-8">
      <h2 className="text-2xl md:text-3xl font-bold">
        Transparency & Data Usage
      </h2>

      <p className="text-muted-foreground mt-3 max-w-3xl">
        theRec is designed with a strong focus on transparency, security, and responsible data handling. 
        This page outlines how our platform works and how user data is used to deliver core functionality.
      </p>

      <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
        
        <div className="rounded-xl border border-border p-4 bg-background/60">
          <p className="font-semibold mb-1">Platform Overview</p>
          <p className="text-muted-foreground">
            theRec enables users to record their screen, upload video content, and manage recordings within collaborative workspaces. 
            Content can be shared securely via private access or public links.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 bg-background/60">
          <p className="font-semibold mb-1">Data We Collect</p>
          <p className="text-muted-foreground">
            We collect essential account and workspace data to enable authentication, team collaboration, subscription management, 
            and service reliability. No unnecessary personal data is collected.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 bg-background/60">
          <p className="font-semibold mb-1">Content Processing</p>
          <p className="text-muted-foreground">
            Uploaded recordings are securely processed to generate playable formats, thumbnails, and metadata. 
            This processing is required to deliver streaming, sharing, and organization features.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 bg-background/60">
          <p className="font-semibold mb-1">Privacy & Compliance</p>
          <p className="text-muted-foreground">
            We are committed to protecting user data and complying with applicable privacy standards. 
            For full details, please review our{" "}
            <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/terms-and-conditions" className="underline underline-offset-4 hover:text-foreground">
              Terms & Conditions
            </Link>.
          </p>
        </div>

      </div>
    </div>
  </section>
</Reveal>

      {/* How it works */}
      <Reveal from="left">
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
          <p className="text-muted-foreground mt-3">Create and share polished videos in minutes.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Record or Upload", desc: "Capture your screen instantly or upload existing clips." },
            { step: "02", title: "Auto Process", desc: "We process your videos and generate thumbnails automatically." },
            { step: "03", title: "Share & Collaborate", desc: "Send secure links, manage visibility, and work together." },
          ].map((item) => (
            <div key={item.step} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-sm text-primary font-semibold">{item.step}</p>
              <h3 className="font-semibold text-lg mt-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
  <h2 className="text-3xl md:text-4xl font-bold mb-6">
    Stop wasting time in meetings
  </h2>
  <p className="text-muted-foreground max-w-2xl mx-auto">
    theRec helps teams communicate visually. Record once, share instantly, and let others watch on their time.
  </p>
</section>
      {/* Plans */}
      {(plansLoading || plans.length > 0) && (
        <Reveal from="right">
          <section id="plans-section" className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold">Simple plans for every team</h2>
              <p className="text-muted-foreground mt-3">Start free, then scale with advanced collaboration and limits.</p>
            </div>
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
                    className={`glass relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
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
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Loved by modern teams</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "theRec helped us cut meeting time by half. We now share quick video updates instead.",
              name: "Aya O.",
              role: "Product Manager",
            },
            {
              quote: "Upload and sharing are super fast. The team workspace features made collaboration much easier.",
              name: "Karim M.",
              role: "Engineering Lead",
            },
            {
              quote: "Our support replies became clearer and customers understand fixes much faster with video.",
              name: "Lina S.",
              role: "Customer Success",
            },
          ].map((item) => (
            <div key={item.name} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-sm text-muted-foreground">"{item.quote}"</p>
              <p className="mt-4 font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.role}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      {/* FAQ */}
      <Reveal from="right">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
        {[
  {
    q: "Do viewers need an account to watch my videos?",
    a: "No. Anyone with a public link can watch your video instantly—no sign-up required. You can also restrict access to your team only when needed.",
  },
  {
    q: "How is this different from a normal screen recorder?",
    a: "theRec is built for communication, not just recording. You can record, instantly share via link, and collaborate with your team—all in one place.",
  },
  {
    q: "Can I control who sees my recordings?",
    a: "Yes. You can keep videos private, share them with your workspace, or generate secure public links depending on your needs.",
  },
  {
    q: "Do I need to install anything?",
    a: "No installation required. theRec works directly in your browser, so you can start recording in seconds.",
  },
  {
    q: "How fast are recordings processed?",
    a: "Your videos are processed automatically in the background, so they’re ready to share within moments after recording.",
  },
  {
    q: "Can I use it with my team?",
    a: "Absolutely. Create workspaces, invite teammates, assign roles, and collaborate on recordings بسهولة.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. You can start for free with core features, then upgrade anytime as your needs grow.",
  },
  {
    q: "Are my recordings secure?",
    a: "Yes. Your data is securely stored, and you have full control over privacy and access permissions.",
  },
].map((item) => (
            <div key={item.q} className="glass rounded-xl p-5 hover:-translate-y-0.5 transition-transform duration-300">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="text-sm text-muted-foreground mt-2">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      {/* Final CTA */}
      <Reveal from="left">
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="glass rounded-3xl p-10 md:p-14 text-center hover:border-primary/30 transition-colors duration-300">
          {user ? (
            <>
              <h2 className="text-3xl md:text-4xl font-bold">Welcome back, {user.user_name}</h2>
              <p className="text-muted-foreground mt-3">Jump back into your workspace and continue creating.</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link to="/dashboard">
                  <Button size="lg" className="gradient-primary">Open Dashboard</Button>
                </Link>
                <Link to="/workspaces">
                  <Button size="lg" variant="outline">Manage Workspaces</Button>
                </Link>
              </div>
            </>
          ) : (
            <>
            <h2 className="text-3xl md:text-4xl font-bold">
  Replace your next meeting with a video
</h2>
<p className="text-muted-foreground mt-3">
  Start recording for free. No credit card required.
</p>
              <p className="text-muted-foreground mt-3">Create your first workspace and share your first video today.</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link to="/register">
                  <Button size="lg" className="gradient-primary">Get Started Free</Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">Sign In</Button>
                </Link>
              </div>
            </>
          )}
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

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full font-medium ${className}`}>{children}</span>;
}

function Reveal({ children, from = "left" }: { children: ReactNode; from?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenClass = from === "right" ? "translate-x-8" : "-translate-x-8";

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0" : `opacity-0 ${hiddenClass}`}`}
    >
      {children}
    </div>
  );
}
