export default function ErrorPage() {
    return (
      <div
        className="relative min-h-screen overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, hsl(220 90% 56%), hsl(262 80% 60%))",
        }}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-pink-400/20 blur-3xl" />
  
        {/* Floating Decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 h-2 w-2 rounded-full bg-white/60" />
          <div className="absolute top-40 right-32 h-3 w-3 rounded-full bg-white/30" />
          <div className="absolute bottom-32 left-40 h-2 w-2 rounded-full bg-white/40" />
          <div className="absolute bottom-20 right-20 h-4 w-4 rounded-full bg-white/20" />
  
          <div className="absolute top-24 right-1/4 h-px w-32 rotate-[-25deg] bg-white/30" />
          <div className="absolute top-40 right-16 h-px w-24 rotate-[-25deg] bg-white/30" />
        </div>
  
        {/* Main Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          {/* 404 */}
          <div className="relative mb-4">
            <h1 className="text-[140px] font-black leading-none tracking-tight drop-shadow-2xl md:text-[220px]">
              404
            </h1>
  
            {/* Glow Ring */}
            <div className="absolute inset-0 -z-10 rounded-full border border-white/10 blur-2xl" />
          </div>
  
          {/* Title */}
          <h2 className="mb-4 text-3xl font-bold md:text-5xl">
            Oops! Page not found
          </h2>
  
          {/* Subtitle */}
          <p className="max-w-xl text-base text-white/80 md:text-lg">
            The page you’re looking for doesn’t exist, was moved, or is
            temporarily unavailable.
          </p>
  
          {/* Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button className="rounded-2xl bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-white/90">
              Back to Home
            </button>
  
            <button className="rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/20">
              Contact Support
            </button>
          </div>
  
          {/* Bottom Card */}
          <div className="mt-20 w-full max-w-5xl rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-6 text-left transition hover:bg-white/20">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                  🔍
                </div>
                <h3 className="text-xl font-semibold">Explore</h3>
                <p className="mt-2 text-sm text-white/70">
                  Discover new pages and content across the platform.
                </p>
              </div>
  
              <div className="rounded-2xl bg-white/10 p-6 text-left transition hover:bg-white/20">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                  ⚡
                </div>
                <h3 className="text-xl font-semibold">Fast Navigation</h3>
                <p className="mt-2 text-sm text-white/70">
                  Jump back quickly and continue where you left off.
                </p>
              </div>
  
              <div className="rounded-2xl bg-white/10 p-6 text-left transition hover:bg-white/20">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                  💬
                </div>
                <h3 className="text-xl font-semibold">Need Help?</h3>
                <p className="mt-2 text-sm text-white/70">
                  Reach out to support if the issue continues.
                </p>
              </div>
            </div>
          </div>
  
          {/* Footer */}
          <p className="mt-8 text-sm text-white/60">
            Thanks for being here ✨
          </p>
        </div>
      </div>
    );
  }
  