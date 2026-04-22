import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Monitor, Play, Upload, Users, Shield, Zap, ArrowRight, Check, Loader2, CircleCheck } from "lucide-react";
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

export default function Index() {
  const { user, selectedWorkspaceId, refreshUser, lastAuthError } = useAuth();
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

  useEffect(() => {
    try {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (e: any) {
      console.error(e);
    }
  }, []);

  const avatarSrc = useAvatarSrc(user?.avatar_url || user?.avatar);
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
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
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "successful") {
      setSuccessDialogOpen(true);
      setCancelDialogOpen(false);
    } else if (paymentStatus === "cancelled") {
      setCancelDialogOpen(true);
      setSuccessDialogOpen(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) return;
    const googleApi = (window as any)?.google?.accounts?.id;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!googleApi || !clientId) return;

    googleApi.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
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

    googleApi.prompt();
  }, [lastAuthError, navigate, refreshUser, toast, user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="gradient-primary rounded-xl p-2">
              <Monitor className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">ScreenFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/profile" className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.user_name || "User avatar"} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {user?.user_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="text-sm text-foreground">{user.email}</span>
              </Link>
            ) : (
              <>
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
          Record, Share &<br />
          <span className="gradient-text">Collaborate</span> Instantly
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Capture your screen, add context, and share with your team — all in one beautiful platform. No downloads required.
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
      </section>
      </Reveal>
  {/* Ad here */}
  {/* <!-- landing _top --> */}
      <ins className="adsbygoogle block"
      style={{display:"block"}}
        data-ad-client="ca-pub-7034676662232707"
        data-ad-slot="9591210325"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      {/* Features */}
      <Reveal from="right">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Upload, title: "Easy Upload", desc: "Drag & drop your recordings with multipart upload for reliability." },
            { icon: Users, title: "Team Workspaces", desc: "Invite teammates, manage roles, and collaborate on recordings." },
            { icon: Shield, title: "Secure Sharing", desc: "Share via public links or keep recordings private to your team." },
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
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${plan.monthlyPrice || 0}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Up to {Number(plan.maxTeamMembers || 0)} members
                    </p>
                    {plan.yearlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${plan.yearlyPrice}/year (save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
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
<ins className="adsbygoogle"
     style={{display:"block"}}
     data-ad-client="ca-pub-7034676662232707"
     data-ad-slot="2452228548"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
      {/* Testimonials */}
      <Reveal from="left">
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Loved by modern teams</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "ScreenFlow helped us cut meeting time by half. We now share quick video updates instead.",
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
              q: "Do teammates need an account to view videos?",
              a: "Public links can be viewed without an account, while private workspace content requires access.",
            },
            {
              q: "Can I control video visibility?",
              a: "Yes. You can keep videos private or generate public links depending on your workflow.",
            },
            {
              q: "Is there a team workspace model?",
              a: "Yes. Invite members, manage roles, and collaborate under shared workspace settings.",
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
              <h2 className="text-3xl md:text-4xl font-bold">Start recording in seconds</h2>
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
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ScreenFlow. All rights reserved.
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
