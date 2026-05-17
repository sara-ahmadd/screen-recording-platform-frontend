"use client";

import React from "react";

import { 
  Play, 
  ArrowLeft, 
  Sparkles, 
  Monitor, 
  Share2, 
  Layers, 
  CheckCircle2 
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DemoPage() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden antialiased selection:bg-violet-500/30">
      
      {/* NOISE & GRADIENT AMBIENCE */}
      {/* Overlay 1: Noise Texture */}
      <div className="absolute inset-0 bg-noise opacity-[0.015] dark:opacity-[0.03] pointer-events-none z-50" />
      
      {/* Overlay 2: Ambient Glowing Radials */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-500/10 dark:bg-violet-500/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-500/[0.05] blur-[100px] pointer-events-none" />

      {/* CORE CONTAINER */}
      <main className="max-w-full mx-auto px-6 py-12 relative z-10">
        
        {/* HEADER NAVIGATION */}
        <div className="flex items-center justify-between mb-12">
          <Link 
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
            Back to home
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Platform Walkthrough
          </div>
        </div>

        {/* PAGE INTRO */}
        <div className="max-w-3xl mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            See theRec.site in Action.
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed">
            A quick 60-second tour showcasing how creators and engineering teams capture ideas, organize workspaces, and share links instantly.
          </p>
        </div>

        {/* HERO PREMIUM NOISE-GLASS VIDEO PLAYER */}
        <div className="relative rounded-3xl border border-border/60 dark:border-white/[0.08] bg-white/[0.02] dark:bg-black/[0.15] backdrop-blur-xl p-3 md:p-4 shadow-2xl shadow-violet-500/[0.03]  max-w-5xl mx-auto">
          
          {/* Internal ambient glowing border accent */}
          <div className="absolute inset-0 rounded-3xl border border-gradient-to-br from-violet-500/20 to-transparent pointer-events-none" />
          
          {/* Actual Video Aspect Box */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted/30 group border border-border/40">
            
            {/* REPLACE the source below with your hosted path (e.g., Cloudinary, Vercel Blob, AWS S3) */}
            <video 
              className="h-full w-full object-cover"
              controls
              poster="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop"
              preload="metadata"
              playsInline
            >
              <source src="/demo-walkthrough.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Fancy Floating Status Indicator */}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md border border-border/60 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 pointer-events-none">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 absolute left-3" />
              System Demo Video
            </div>
          </div>
        </div>

        {/* NARRATIVE JOURNEY WALKTHROUGH SECTION */}
        <div className="mt-16 border-t border-border/40 pt-12">
          <h2 className="text-2xl font-black tracking-tight text-foreground mb-8">
            The User Journey Blueprint
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* STEP 1 */}
            <div className="relative rounded-2xl border border-border/40 bg-white/[0.01] dark:bg-white/[0.002] backdrop-blur-md p-6 hover:border-violet-500/20 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/10">
                <Monitor className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">1. One-Click Initialization</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Launch recording sessions instantaneously without extension overhead. The browser pipeline catches high-definition frames and local hardware audio configurations with zero configuration delay.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="relative rounded-2xl border border-border/40 bg-white/[0.01] dark:bg-white/[0.002] backdrop-blur-md p-6 hover:border-violet-500/20 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/10">
                <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">2. Cloud Encoding Pipelines</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The moment you click complete, your recording asset passes into optimized rendering blocks on our backend. Thumbnails are automatically generated while streams adapt seamlessly for cross-device playback.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="relative rounded-2xl border border-border/40 bg-white/[0.01] dark:bg-white/[0.002] backdrop-blur-md p-6 hover:border-violet-500/20 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/10">
                <Share2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">3. Instant Distribution</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Organize videos inside isolated, shareable workspaces. Your secure share token is copied directly to your clipboard automatically, reducing your communication loop down to a single click.
              </p>
            </div>

          </div>
        </div>

        {/* CALL TO ACTION ACCENT BLOCK */}
        <div className="mt-16 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.05] via-transparent to-fuchsia-500/[0.02] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-xl font-bold text-foreground tracking-tight flex items-center justify-center md:justify-start gap-2">
              Ready to replace video bloat?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Create your first asset in seconds. No credit cards, no heavy installations. Just clear, friction-free async engineering updates.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="w-full md:w-auto text-center px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
          >
            Start Recording Free
          </Link>
        </div>

      </main>
    </div>
  );
}