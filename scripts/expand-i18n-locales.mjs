/**
 * Expands en/ar locale JSON files to production-complete coverage.
 * Run: node scripts/expand-i18n-locales.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOCALES_DIR = path.join(ROOT, "src/i18n/locales");

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      out[key] = deepMerge(target[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

function countKeys(obj) {
  let n = 0;
  for (const k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      n += countKeys(obj[k]);
    } else {
      n++;
    }
  }
  return n;
}

function loadJson(locale, ns) {
  const p = path.join(LOCALES_DIR, locale, `${ns}.json`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(locale, ns, data) {
  const dir = path.join(LOCALES_DIR, locale);
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, `${ns}.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

const EN_ADDITIONS = {
  common: {
    theme: { toggle: "Toggle theme", light: "Light", dark: "Dark", system: "System" },
    validation: {
      required: "This field is required",
      emailInvalid: "Enter a valid email",
      minLength: "Must be at least {{min}} characters",
      passwordsMismatch: "Passwords do not match",
    },
    userAvatar: "User avatar",
    tryAgain: "Please try again.",
    refresh: "Refresh",
    plan: "Plan",
    perMonthShort: "/mo",
    perYearShort: "/year",
    membersUpTo: "Up to {{count}} members",
    yearlySave: "({{egp}} EGP ≈ ${{usd}} USD) /year (save {{percent}}%)",
    signInRequiredFree: "Please sign in to subscribe to the free plan.",
    googleNoToken: "Google sign-in did not return access token.",
    googleSessionFailed: "Could not verify Google session.",
    paidToFree: {
      subscribed: "Subscribed",
      subscribedDesc: "You are now on the free plan.",
      noSubscription: "No subscription",
      noSubscriptionDesc: "Could not find a subscription to cancel.",
      updated: "Subscription updated",
      updatedDesc: "Your subscription was downgraded to the free plan.",
      downgradeFailed: "Could not downgrade subscription",
      workspaceNotFound: "Workspace not found",
      workspaceNotFoundDesc: "Select a valid workspace and try again.",
    },
  },
  home: {
    hero: {
      goDashboard: "Go to Dashboard",
      startRecording: "Start Recording",
      watchDemo: "Watch Demo",
      startFree: "Start Recording free",
      noDownloadLine: "No download required • Works in your browser • Free plan available",
      noCreditCard: "No credit card required",
      disclaimer:
        "theRec is the official website for recording your screen, uploading videos, and collaborating with your workspace team. To use core features, we request account/profile information and recording metadata only to authenticate users, organize workspaces, process videos, and enable secure sharing. Read our full policy here:",
      privacyLink: "Privacy Policy",
    },
    trust: {
      badge: "Trust & Security",
      title: "Built with transparency,",
      titleAccent: "privacy, and secure collaboration",
      description:
        "theRec is designed for modern teams that need secure video communication, protected workspace collaboration, and reliable recording infrastructure.",
      items: {
        auth: {
          title: "Secure Authentication",
          desc: "Protected login, workspace access control, and secure account authentication across your organization.",
        },
        private: {
          title: "Private Video Access",
          desc: "Control who can access recordings using workspace permissions or secure shareable links.",
        },
        processing: {
          title: "Automated Video Processing",
          desc: "Videos are automatically optimized for playback, streaming, thumbnails, and organization.",
        },
        minimal: {
          title: "Minimal Data Collection",
          desc: "We only collect essential account and recording data necessary to operate the platform.",
        },
      },
    },
    overview: {
      badge: "Site Overview",
      title: "Everything your team needs",
      titleAccent: "to communicate with video",
      description:
        "theRec helps teams record, explain, share, and collaborate asynchronously — without meetings, complicated tools, or downloads.",
      features: {
        instant: {
          title: "Instant Browser Recording",
          desc: "Start recording immediately with no installation required. Capture your screen, tab, or window directly from your browser.",
        },
        upload: {
          title: "Upload Existing Videos",
          desc: "Already have recordings? Upload and organize them inside your workspace in seconds.",
        },
        async: {
          title: "Async Team Collaboration",
          desc: "Share visual updates instead of scheduling meetings. Keep communication faster and clearer.",
        },
        privacy: {
          title: "Privacy & Access Control",
          desc: "Keep recordings private, workspace-only, or publicly shareable with secure links.",
        },
        playback: {
          title: "Fast Video Playback",
          desc: "Videos are processed automatically for smooth streaming and instant viewing.",
        },
        workspace: {
          title: "Workspace Organization",
          desc: "Manage recordings, teammates, permissions, and collaboration from one central place.",
        },
      },
    },
    asyncCta: {
      badge: "Async Communication",
      title: "Replace long meetings",
      titleAccent: "with quick video updates",
      description:
        "Share product demos, bug reports, tutorials, onboarding videos, and team updates without interrupting everyone's schedule.",
      tags: {
        demos: "Product demos",
        bugs: "Bug reporting",
        updates: "Team updates",
        walkthroughs: "Client walkthroughs",
        onboarding: "Async onboarding",
      },
    },
    pricing: {
      badge: "Pricing",
      title: "Flexible pricing for",
      titleAccent: "individuals and teams",
      planFallback: "Plan",
      perMonth: "EGP",
      perMonthUsd: "USD /mo",
      members: "Up to {{count}} members",
      signInRequired: "Sign in required",
      signInRequiredDesc: "Please sign in to subscribe to the free plan.",
    },
    testimonials: {
      badge: "Testimonials",
      title: "Trusted by modern",
      titleAccent: "remote-first teams",
      description: "Teams use theRec to reduce meetings, explain faster, and collaborate more efficiently with video.",
      items: {
        aya: {
          quote: "theRec completely changed how our product team communicates updates asynchronously.",
          name: "Aya O.",
          role: "Product Manager",
        },
        karim: {
          quote: "We replaced many internal meetings with quick recordings and saved hours every week.",
          name: "Karim M.",
          role: "Engineering Lead",
        },
        lina: {
          quote: "Support explanations became much clearer after switching to video walkthroughs.",
          name: "Lina S.",
          role: "Customer Success",
        },
      },
    },
    faq: {
      title: "Questions?",
      titleAccent: "We've got answers",
      items: {
        q1: {
          q: "What is theRec used for?",
          a: "theRec helps individuals and teams record their screen, explain ideas visually, share video updates, and collaborate asynchronously without unnecessary meetings.",
        },
        q2: {
          q: "Do I need to install any software?",
          a: "No. theRec works directly in your browser, so you can start recording instantly without downloading or installing anything.",
        },
        q3: {
          q: "Can I share recordings with people outside my workspace?",
          a: "Yes. You can generate secure public links for external sharing or keep videos private inside your workspace.",
        },
        q4: {
          q: "Is theRec suitable for remote teams?",
          a: "Absolutely. theRec is built for async communication, making it ideal for remote teams, distributed companies, product demos, onboarding, and team updates.",
        },
        q5: {
          q: "How are videos processed after recording?",
          a: "Videos are automatically processed in the background to generate optimized playback formats, thumbnails, and streaming-ready files.",
        },
        q6: {
          q: "Can I upload existing videos?",
          a: "Yes. In addition to screen recording, you can upload existing video files and organize them inside your workspace.",
        },
        q7: {
          q: "Are recordings private and secure?",
          a: "Yes. You control who can access recordings through workspace permissions and secure sharing settings.",
        },
        q8: {
          q: "Is there a free plan available?",
          a: "Yes. You can start with a free plan and upgrade anytime when your team needs more storage, collaboration, and advanced features.",
        },
      },
    },
    cta: {
      welcomeBackBadge: "Welcome Back",
      welcomeBackTitle: "Continue creating",
      welcomeBackTitleAccent: "and collaborating",
      welcomeBackDesc: "Jump back into your workspace and manage your recordings.",
      startFreeBadge: "Start Free",
      startFreeTitle: "Start recording",
      startFreeTitleAccent: "in less than a minute",
      startFreeDesc:
        "Create your workspace, record your screen, and collaborate with your team — directly from the browser.",
      signIn: "Sign In",
    },
    dialogs: {
      workspaceRequiredSelect: "Select a workspace first",
      workspaceRequiredCreate: "Create a workspace first",
      workspaceRequiredSelectDesc: "To continue with the free plan, please select a workspace.",
      workspaceRequiredCreateDesc:
        "You do not have any workspaces yet. Create one to continue with the free plan.",
    },
    footer: { contact: "Contact", about: "About", blogs: "Blogs" },
  },
  marketing: {
    contact: {
      supportDesc:
        "Reach out for active platform issues, workspace account lockouts, or video processing glitches.",
      generalDesc:
        "Drop us a line regarding bulk workspace upgrades, enterprise discussions, or media collaborations.",
      slaDesc:
        "We read every engineer ticket manually. Our response rate hovers between standard operational timelines.",
    },
    about: {
      originP1:
        "theRec.site started because I needed a screen recording platform that was instantly fast, highly reliable, and actually pleasant to use every single day.",
      originP2:
        "Most tools on the market have become overly complicated, locked behind steep paywalls, or tuned exclusively for giant corporate sales teams. I wanted a lightweight, frictionless alternative built for high-velocity builders, creators, and teams who just need to:",
      bullet1: "Launch records instantly right from the browser",
      bullet2: "Process and host high-def video automatically",
      bullet3: "Share instant-copy links with zero friction",
      bullet4: "Organize team communication in clean workspaces",
      originP3:
        "Instead of waiting for someone else to fix the broken UX of modern video sharing, I decided to build the solution myself.",
      transparentBody:
        "theRec.site isn't backed by aggressive venture capital or hidden corporate agendas. It is an independent platform focused purely on engineering a dependable, fast product for real people.",
      uxTitle: "Obsessed with UX speed",
      uxBody:
        "Every feature is designed to cut down your time-to-share. By removing confusing sub-menus, optimizing cloud rendering, and refining the recorder layout, your asynchronous workflows become effortless.",
      uxFooter: "Perfect for: Bug reports, tutorials, and rapid team updates.",
      frictionTitle: "Frictionless Workflows",
      frictionBody: "Capture, render, and deploy your video links seamlessly with minimal clicks.",
      collabTitle: "Async Collaboration",
      collabBody: "Shared workspaces engineered specifically to keep modern distributed teams aligned.",
      iterationTitle: "Continuous Iteration",
      iterationBody: "Evolving aggressively based on actual community feedback and practical utility.",
      closingTitle: "A communication tool built with care.",
      closingBody:
        "No dynamic pricing traps. No unnecessary bells and whistles. Just an ultra-reliable platform focused entirely on helping you communicate clearly through instant video.",
      closingThanks: "Thanks for being part of the journey.",
    },
    demo: {
      title: "Platform Demo",
      subtitle: "See how theRec works end to end.",
      initBody:
        "Launch recording sessions instantaneously without extension overhead. The browser pipeline catches high-definition frames and local hardware audio configurations with zero configuration delay.",
      encodingBody:
        "The moment you click complete, your recording asset passes into optimized rendering blocks on our backend. Thumbnails are automatically generated while streams adapt seamlessly for cross-device playback.",
      distributionBody:
        "Organize videos inside isolated, shareable workspaces. Your secure share token is copied directly to your clipboard automatically, reducing your communication loop down to a single click.",
      ctaDesc:
        "Create your first asset in seconds. No credit cards, no heavy installations. Just clear, friction-free async engineering updates.",
      systemDemo: "System Demo Video",
    },
    blogs: {
      title: "Blogs",
      subtitle: "Helpful articles for teams using a screen recording SaaS platform.",
      articles: {
        a1: {
          title: "How Screen Recording Flow Works in theRec",
          body: "A recording starts from capture or upload, then moves into multipart transfer, processing, thumbnail generation, and final shareable output. Understanding this flow helps teams debug delays and improve recording quality.",
          p1: "Capture or upload stage",
          p2: "Reliable multipart transfer",
          p3: "Processing and status updates",
          p4: "Ready state and sharing",
        },
        a2: {
          title: "Screen + Camera Track vs Single Source Recording",
          body: "Use both screen and camera when context, personality, or demos benefit from face visibility. Use screen-only for focused walkthroughs and camera-only for quick announcements or feedback.",
          p1: "Screen + camera for explainers and onboarding",
          p2: "Screen-only for technical walkthroughs",
          p3: "Camera-only for async team updates",
          p4: "Choose based on audience and objective",
        },
        a3: {
          title: "Top Use Cases for a Screen Recording SaaS",
          body: "Screen recording platforms help across engineering, product, design, support, and sales. Teams can reduce meetings and improve clarity by sending concise visual updates.",
          p1: "Bug reporting and QA reproduction",
          p2: "Feature demos and release updates",
          p3: "Customer support responses",
          p4: "Internal training and onboarding",
        },
        a4: {
          title: "Best Practices for High-Quality Recordings",
          body: "Plan your message, keep recordings short, and control visual noise. Better source quality reduces processing issues and improves viewer retention.",
          p1: "Use a clear outline before recording",
          p2: "Keep videos task-focused and concise",
          p3: "Record in a quiet environment",
          p4: "Set correct visibility before sharing",
        },
        a5: {
          title: "Understanding Recording Statuses and Lifecycle",
          body: "Each recording goes through multiple states from upload to final readiness. Knowing what each status means helps users and developers quickly identify issues and track progress.",
          p1: "Uploading: chunks are being transferred",
          p2: "Processing: transcoding and thumbnail generation",
          p3: "Ready: video is fully available",
          p4: "Failed: errors during upload or processing",
        },
        a6: {
          title: "How to Optimize Video Upload Performance",
          body: "Efficient uploads improve user experience and reduce failure rates. Proper chunk sizing, retries, and network handling are critical for reliable large video transfers.",
          p1: "Use multipart uploads for large files",
          p2: "Choose optimal chunk sizes (e.g., 5MB+)",
          p3: "Implement retry logic for failed parts",
          p4: "Track progress and handle network interruptions",
        },
      },
    },
    subscriptionFlow: {
      badge: "Subscription workflow",
      title: "Upgrade your workspace",
      titleAccent: "in minutes",
      description:
        "A seamless billing and subscription experience designed for teams, creators, and businesses using theRec platform.",
      previewAlt: "Subscription workflow",
      preview: "Preview",
      steps: {
        s1: {
          title: "Current Subscription",
          desc: "After logging into the platform, the user navigates to the Billing page from the dashboard sidebar. The current workspace subscription details, billing cycle, active plan, and subscription history are displayed here.",
        },
        s2: {
          title: "Choose a Plan",
          desc: "The user can click \"Change your plan\" or upgrade to another plan. A pricing page is displayed with all available plans alongside monthly and yearly billing options for easy comparison.",
        },
        s3: {
          title: "Confirm Subscription",
          desc: "After selecting a plan, the user is redirected to a confirmation page where recurring billing authorization and agreement to the terms and conditions must be accepted before continuing.",
        },
        s4: {
          title: "Enter Billing Information",
          desc: "A billing popup or dialog appears requesting customer billing information such as name, email, country, city, address, and optional promo code before proceeding.",
        },
        s5: {
          title: "Final Review & Payment",
          desc: "The final checkout review page displays the selected subscription plan, billing cycle, and payment summary. Clicking \"Continue to Payment\" redirects the user to Checkout review  where the payment is securely completed.",
        },
      },
    },
  },
  legal: {
    terms: {
      s3Title: "3. Subscription Billing & Renewals",
      s3Body:
        "Paid plans renew automatically according to the billing cycle you select unless cancelled before the renewal date. You authorize recurring charges to your selected payment method.",
      s4Title: "4. Service Availability",
      s4Body:
        "We strive for high uptime but do not guarantee uninterrupted access. Maintenance windows, third-party outages, or force majeure may affect availability.",
      s5Title: "5. Limitation of Liability",
      s5Body:
        "To the maximum extent permitted by law, theRec is not liable for indirect, incidental, or consequential damages arising from use of the service.",
      s6Title: "6. Modifications",
      s6Body:
        "We may update these terms. Material changes will be communicated through the platform or email where appropriate.",
      prohibitedList: {
        malware: "Distributing malware or abusive content",
        unauthorized: "Unauthorized access to accounts or data",
        harassment: "Harassment or illegal activity",
        circumvention: "Circumventing technical limits or security controls",
      },
    },
    privacy: {
      contact: "For privacy requests, contact us via the Contact page.",
    },
  },
  recording: {
    subtitle: "1080p screen recording with webcam/mic controls and robust upload.",
    checklist: {
      title: "Pre-record checklist",
      browser: "Browser: {{browser}}. You can share an entire screen, a window, or a browser tab.",
      audioTip:
        "Tip: to capture website audio, share the browser tab and enable audio in the share dialog",
    },
    status: {
      surface: "Surface",
      systemAudio: "System audio",
      detected: "detected",
      notDetected: "not detected",
      resolution: "Resolution",
      cameraPreview: "Camera preview",
      pictureInPicture: "picture-in-picture",
      inPage: "in page",
      unknown: "unknown",
    },
    preview: { main: "Main preview (Screen)" },
    controls: {
      pause: "Pause",
      resume: "Resume",
      restart: "Restart",
      stop: "Stop",
      startCountdown: "Start countdown",
    },
    pip: { restart: "Restart", stop: "Stop" },
    processingOverlay: {
      finalizing: "Finalizing recording...",
      processing: "Processing recording...",
      keepTabOpen: "Please keep this tab open, operation might take some minutes.",
      estimatedWait: "Estimated wait: {{seconds}}s",
    },
    workspaceDialog: {
      title: "Workspace required",
      description:
        "Please select a workspace before starting recording. If you do not have one yet, create a workspace first.",
      goWorkspaces: "Go to Workspaces",
    },
    shareDialog: {
      title: "theRec",
      description: "Choose what to share before starting recording.",
      shareTarget: "Share target",
      systemSoundHint: "Enabled by default for tab/system audio capture.",
    },
    permissions: {
      title: "Permissions",
      description: "Manage microphone and camera access for this recording.",
      microphone: "Microphone",
      camera: "Camera",
      permission: "Permission",
      mergeLayout: "Camera merge layout",
      mergeHint:
        "These values are sent to backend so FFmpeg can compose the camera beside the screen.",
      position: "Position",
      shape: "Shape",
      scale: "Scale",
      positions: {
        topLeft: "top left",
        topRight: "top right",
        bottomLeft: "bottom left",
        bottomRight: "bottom right",
      },
    },
    camera: {
      dragHint: "Drag to move camera preview",
      continuesWithoutCamera: "Recording continues without camera.",
      continuesWithoutMic: "Recording continues without mic.",
      uploadPartialFail:
        "Screen recording was saved, but camera track completion failed. You can retry camera processing in backend.",
    },
    countdown: { startsShortly: "Recording starts shortly.", draftRemoved: "Draft recording removed." },
    processingDesc: "Your recording is being processed.",
    noAudioHint:
      "To capture YouTube sound, share a browser tab/window with audio enabled in the share dialog.",
    browserUnsupported: "This browser does not support screen recording.",
    defaultTitle: "Recording {{date}}",
    upload: {
      dropVideoOnly: "Please drop a video file.",
      workspaceRequired: "Workspace required",
      processingDesc: "Your video is now being processed.",
      cancelled: "Upload cancelled",
      cancelTitle: "Cancel this upload?",
      cancelDesc:
        "This will stop the current upload, abort multipart upload on the server, and delete this recording draft.",
      keepUploading: "Keep uploading",
      titlePlaceholder: "Recording title",
    },
  },
  dashboard: {
    detail: {
      back: "Back",
      refresh: "Refresh",
      created: "Created {{date}}",
      size: "Size",
      duration: "Duration",
      mb: "MB",
      min: "min",
      visibility: "Visibility",
      videoProcessing: "Video is being processed...",
      videoUnavailable: "Video preview unavailable",
      resumingUpload: "Resuming upload and finalizing already uploaded parts...",
      resumeUpload: "Resume Upload",
      download: "Download",
      shareLink: "Share Link",
      removeWatermark: "Remove Watermark",
      retryProcessing: "Retry Processing",
      moveToTrash: "Move to Trash",
      deletePermanently: "Delete Permanently",
      planNoDownload: "Your current plan does not allow video downloads.",
      planNoWatermark: "Your current plan does not allow watermark removal.",
      privateShareBlocked: "Video cannot be shared because it is private. Make it public first.",
      linkCopied: "Link copied to clipboard",
    },
  },
  billing: {
    dialog: {
      title: "Billing Details",
      description: "Fill your billing information to continue creating the subscription.",
      firstName: "First Name",
      lastName: "Last Name",
      phoneNumber: "Phone Number",
      street: "Street",
      postalCode: "Postal Code",
      country: "Country",
      city: "City",
      state: "State",
      promoCode: "Promo Code",
      continuePayment: "Continue to payment",
      loadingCountries: "Loading countries...",
      selectCountry: "Select a country",
      selectCountryFirst: "Select country first",
      loadingCities: "Loading cities...",
      selectCity: "Select city",
      loadingStates: "Loading states...",
      selectState: "Select state",
      promoPlaceholder: "Enter promo code (optional)",
      placeholders: {
        firstName: "John",
        lastName: "Doe",
        email: "john@company.com",
        street: "Street 12",
        postalCode: "12345",
      },
      validation: {
        firstNameRequired: "First name is required",
        lastNameRequired: "Last name is required",
        emailInvalid: "Enter a valid email",
        phoneRequired: "Phone number is required",
        phoneInvalid: "Enter a valid international phone number",
        streetRequired: "Street is required",
        postalRequired: "Postal code is required",
        countryRequired: "Select a country",
        cityRequired: "City is required",
        cityEnglish: "City must be English only",
        stateRequired: "State is required",
        stateEnglish: "State must be English only",
      },
      errors: {
        countriesLoad: "Could not load countries",
        countriesFailed: "Failed to load countries",
        citiesFailed: "Failed to load cities",
        citiesInvalid: "Invalid cities response",
      },
    },
    workspaceDetails: {
      title: "Active subscription",
      description: "Current plan for your selected workspace.",
      emptySelection: "Select a workspace to see its active subscription.",
      workspaceLogo: "{{name}} logo",
      workspaceFallback: "Workspace",
      noData: "No subscription data available for this workspace.",
      na: "N/A",
      unknownStatus: "unknown",
    },
  },
  workspaces: {
    subtitlePage: "Collaborate with your team",
    needOneDesc: "You need at least one workspace to continue.",
    invitePlaceholder: "colleague@company.com",
  },
  admin: {
    crud: {
      search: "Search",
      create: "Create",
      edit: "Edit",
      delete: "Delete",
      details: "Details",
      refresh: "Refresh",
      save: "Save",
      cancel: "Cancel",
      noResults: "No results found",
      confirmDelete: "Delete this item?",
      rowDetails: "Row details",
    },
    subscriptions: {
      refundAmountPrompt: "Refund amount (leave empty for full):",
      refundReasonPrompt: "Refund reason (optional):",
      simulateRenewal: "Simulate renewal",
      applyFailure: "Apply failure state",
      submitRefund: "Submit refund",
    },
    feedback: { title: "All Feedback" },
    workspaceRecordings: { title: "Workspace Recordings" },
    workspaceRecordingsLoadFailed: "Failed to load workspace recordings",
    feedbackOverviewFailed: "Failed to load feedback overview",
    feedbackListFailed: "Failed to load feedback list",
    promocodeCreated: "Promocode created successfully.",
    promocodeUpdated: "Promocode updated successfully.",
    promocodeCreateFailed: "Could not create promocode.",
    promocodeUpdateFailed: "Could not update promocode.",
    promocodeNoChanges: "No promo code fields were updated.",
    recordingCreated: "Recording created",
    recordingCreatedDesc: "Recording was created successfully.",
    recordingUpdated: "Recording updated",
    recordingUpdatedDesc: "Recording was updated successfully.",
    filterByTitle: "Filter by title",
    filterByStatus: "Filter by status",
    filterByVisibility: "Filter by visibility",
    filterEventType: "Filter event type",
    filterByRating: "Filter by rating",
    websiteSuccessFilter: "Website success filter",
    integrityIncomplete: "Incomplete Paymob subscriptions: {{count}}",
    repairResult: "Repair result → relinked: {{relinked}}, unresolved: {{unresolved}}, markedInvalid: {{markedInvalid}}",
    repairRelinked: "Relinked {{relinked}}, unresolved {{unresolved}}.",
    repairMarkedInvalid: "Marked invalid {{markedInvalid}}.",
    analytics: {
      recordingCreated: "Recording Created",
      recordingCompleted: "Recording Completed",
      completed: "Completed",
      remaining: "Remaining",
    },
    unexpectedError: "Unexpected error",
    requestFailed: "Request failed",
    success: "Success",
    failed: "Failed",
    noChanges: "No changes",
    planLabel: "{{name}} (ID: {{id}})",
    userUnknown: "Unknown",
  },
};

// Arabic translations mirror EN structure
const AR_ADDITIONS = {
  common: {
    feedback: {
      title: "الملاحظات",
      submitTitle: "إرسال ملاحظة",
      submitDesc: "شاركنا تجربتك مع التطبيق.",
      myFeedback: "ملاحظاتي",
      rating: "التقييم",
      selectRating: "اختر التقييم",
      websiteSuccessful: "هل كان الموقع مفيدًا لك؟",
      comment: "تعليق",
      commentPlaceholder: "أخبرنا ما نجح وما يمكن تحسينه...",
      submit: "إرسال الملاحظة",
      editTitle: "تعديل الملاحظة",
      websiteSuccessfulShort: "الموقع ناجح",
      successful: "ناجح",
      date: "التاريخ",
      empty: "لم تُرسل ملاحظات بعد.",
      yes: "نعم",
      no: "لا",
      commentTooShort: "التعليق قصير جدًا",
      commentTooShortDesc: "يجب أن يكون التعليق 5 أحرف على الأقل.",
      submitted: "تم إرسال الملاحظة",
      submittedDesc: "شكرًا لملاحظتك.",
      submitFailed: "فشل إرسال الملاحظة",
      loadFailed: "فشل تحميل الملاحظات",
      updated: "تم تحديث الملاحظة",
      updatedDesc: "تم تحديث ملاحظتك.",
      updateFailed: "فشل تحديث الملاحظة",
      deleteConfirm: "حذف الملاحظة؟",
      deleted: "تم حذف الملاحظة",
      deleteFailed: "فشل حذف الملاحظة",
      actionsCol: "إجراءات",
    },
    theme: { toggle: "تبديل السمة", light: "فاتح", dark: "داكن", system: "النظام" },
    validation: {
      required: "هذا الحقل مطلوب",
      emailInvalid: "أدخل بريدًا إلكترونيًا صالحًا",
      minLength: "يجب أن يكون {{min}} أحرف على الأقل",
      passwordsMismatch: "كلمتا المرور غير متطابقتين",
    },
    userAvatar: "صورة المستخدم",
    tryAgain: "يرجى المحاولة مرة أخرى.",
    refresh: "تحديث",
    plan: "الخطة",
    perMonthShort: "/شهر",
    perYearShort: "/سنة",
    membersUpTo: "حتى {{count}} أعضاء",
    yearlySave: "({{egp}} جنيه مصري ≈ ${{usd}} دولار) /سنة (وفر {{percent}}%)",
    signInRequiredFree: "يرجى تسجيل الدخول للاشتراك في الخطة المجانية.",
    googleNoToken: "لم يُرجع تسجيل Google رمز وصول.",
    googleSessionFailed: "تعذّر التحقق من جلسة Google.",
    paidToFree: {
      subscribed: "تم الاشتراك",
      subscribedDesc: "أنت الآن على الخطة المجانية.",
      noSubscription: "لا يوجد اشتراك",
      noSubscriptionDesc: "تعذّر العثور على اشتراك للإلغاء.",
      updated: "تم تحديث الاشتراك",
      updatedDesc: "تم تخفيض اشتراكك إلى الخطة المجانية.",
      downgradeFailed: "تعذّر تخفيض الاشتراك",
      workspaceNotFound: "لم يُعثر على مساحة العمل",
      workspaceNotFoundDesc: "اختر مساحة عمل صالحة وحاول مرة أخرى.",
    },
  },
  home: {
    hero: {
      goDashboard: "الانتقال إلى لوحة التحكم",
      startRecording: "بدء التسجيل",
      watchDemo: "مشاهدة العرض",
      startFree: "ابدأ التسجيل مجانًا",
      noDownloadLine: "لا حاجة للتنزيل • يعمل في متصفحك • خطة مجانية متاحة",
      noCreditCard: "لا حاجة لبطاقة ائتمان",
      disclaimer:
        "theRec هو الموقع الرسمي لتسجيل الشاشة ورفع الفيديو والتعاون مع فريق مساحة العمل. لاستخدام الميزات الأساسية، نطلب معلومات الحساب/الملف الشخصي وبيانات التسجيل فقط للمصادقة وتنظيم مساحات العمل ومعالجة الفيديو والمشاركة الآمنة. اقرأ سياستنا الكاملة هنا:",
      privacyLink: "سياسة الخصوصية",
    },
    trust: {
      badge: "الثقة والأمان",
      title: "مبني على الشفافية،",
      titleAccent: "الخصوصية والتعاون الآمن",
      description:
        "صُمم theRec للفرق الحديثة التي تحتاج تواصلًا مرئيًا آمنًا وتعاونًا محميًا في مساحات العمل وبنية تسجيل موثوقة.",
      items: {
        auth: {
          title: "مصادقة آمنة",
          desc: "تسجيل دخول محمي، والتحكم في الوصول لمساحات العمل، ومصادقة حسابات آمنة عبر مؤسستك.",
        },
        private: {
          title: "وصول فيديو خاص",
          desc: "تحكم في من يمكنه الوصول للتسجيلات عبر صلاحيات مساحة العمل أو روابط مشاركة آمنة.",
        },
        processing: {
          title: "معالجة فيديو تلقائية",
          desc: "تُحسَّن مقاطع الفيديو تلقائيًا للتشغيل والبث والصور المصغرة والتنظيم.",
        },
        minimal: {
          title: "جمع بيانات محدود",
          desc: "نجمع فقط بيانات الحساب والتسجيل الضرورية لتشغيل المنصة.",
        },
      },
    },
    overview: {
      badge: "نظرة على المنتج",
      title: "كل ما يحتاجه فريقك",
      titleAccent: "للتواصل بالفيديو",
      description:
        "يساعد theRec الفرق على التسجيل والشرح والمشاركة والتعاون بشكل غير متزامن — دون اجتماعات أو أدوات معقدة أو تنزيلات.",
      features: {
        instant: {
          title: "تسجيل فوري من المتصفح",
          desc: "ابدأ التسجيل فورًا دون تثبيت. التقط الشاشة أو التبويب أو النافذة مباشرة من المتصفح.",
        },
        upload: {
          title: "رفع فيديوهات موجودة",
          desc: "لديك تسجيلات مسبقة؟ ارفعها ونظّمها داخل مساحة عملك في ثوانٍ.",
        },
        async: {
          title: "تعاون فريق غير متزامن",
          desc: "شارك تحديثات مرئية بدلًا من جدولة اجتماعات. تواصل أسرع وأوضح.",
        },
        privacy: {
          title: "الخصوصية والتحكم بالوصول",
          desc: "اجعل التسجيلات خاصة أو لمساحة العمل فقط أو قابلة للمشاركة العامة بروابط آمنة.",
        },
        playback: {
          title: "تشغيل فيديو سريع",
          desc: "تُعالج مقاطع الفيديو تلقائيًا لتشغيل سلس ومشاهدة فورية.",
        },
        workspace: {
          title: "تنظيم مساحات العمل",
          desc: "أدر التسجيلات والزملاء والصلاحيات والتعاون من مكان واحد.",
        },
      },
    },
    asyncCta: {
      badge: "التواصل غير المتزامن",
      title: "استبدل الاجتماعات الطويلة",
      titleAccent: "بتحديثات فيديو سريعة",
      description:
        "شارك عروض المنتج وتقارير الأخطاء والدروس وفيديوهات الانضمام وتحديثات الفريق دون مقاطعة جداول الجميع.",
      tags: {
        demos: "عروض المنتج",
        bugs: "الإبلاغ عن الأخطاء",
        updates: "تحديثات الفريق",
        walkthroughs: "جولات للعملاء",
        onboarding: "انضمام غير متزامن",
      },
    },
    pricing: {
      badge: "الأسعار",
      title: "أسعار مرنة",
      titleAccent: "للأفراد والفرق",
      planFallback: "خطة",
      perMonth: "شهريا",
      perMonthUsd: "دولار /شهر",
      members: "حتى {{count}} أعضاء",
      signInRequired: "يلزم تسجيل الدخول",
      signInRequiredDesc: "يرجى تسجيل الدخول للاشتراك في الخطة المجانية.",
    },
    testimonials: {
      badge: "آراء العملاء",
      title: "موثوق من فرق",
      titleAccent: "تعمل عن بُعد",
      description: "تستخدم الفرق theRec لتقليل الاجتماعات والشرح بسرعة والتعاون بكفاءة بالفيديو.",
      items: {
        aya: {
          quote: "غيّر theRec طريقة تواصل فريق المنتج لدينا للتحديثات بشكل غير متزامن.",
          name: "آية ع.",
          role: "مديرة منتج",
        },
        karim: {
          quote: "استبدلنا اجتماعات داخلية كثيرة بتسجيلات سريعة ووفّرنا ساعات كل أسبوع.",
          name: "كريم م.",
          role: "قائد هندسة",
        },
        lina: {
          quote: "أصبحت شروحات الدعم أوضح بكثير بعد التحول إلى جولات فيديو.",
          name: "لينا س.",
          role: "نجاح العملاء",
        },
      },
    },
    faq: {
      title: "أسئلة؟",
      titleAccent: "لدينا الإجابات",
      items: {
        q1: {
          q: "ما استخدام theRec؟",
          a: "يساعد theRec الأفراد والفرق على تسجيل الشاشة وشرح الأفكار مرئيًا ومشاركة التحديثات والتعاون دون اجتماعات غير ضرورية.",
        },
        q2: {
          q: "هل أحتاج لتثبيت برنامج؟",
          a: "لا. يعمل theRec مباشرة في متصفحك، فتبدأ التسجيل فورًا دون تنزيل أو تثبيت.",
        },
        q3: {
          q: "هل يمكنني مشاركة التسجيلات مع أشخاص خارج مساحة العمل؟",
          a: "نعم. يمكنك إنشاء روابط عامة آمنة للمشاركة الخارجية أو إبقاء الفيديو خاصًا داخل مساحة العمل.",
        },
        q4: {
          q: "هل يناسب theRec الفرق عن بُعد؟",
          a: "بالتأكيد. بُني theRec للتواصل غير المتزامن، مثالي للفرق البعيدة والشركات الموزعة والعروض والانضمام والتحديثات.",
        },
        q5: {
          q: "كيف تُعالج الفيديوهات بعد التسجيل؟",
          a: "تُعالج تلقائيًا في الخلفية لإنشاء صيغ تشغيل محسّنة وصور مصغرة وملفات جاهزة للبث.",
        },
        q6: {
          q: "هل يمكنني رفع فيديوهات موجودة؟",
          a: "نعم. بالإضافة لتسجيل الشاشة، يمكنك رفع ملفات فيديو وتنظيمها داخل مساحة العمل.",
        },
        q7: {
          q: "هل التسجيلات خاصة وآمنة؟",
          a: "نعم. تتحكم في من يصل للتسجيلات عبر صلاحيات مساحة العمل وإعدادات المشاركة الآمنة.",
        },
        q8: {
          q: "هل توجد خطة مجانية؟",
          a: "نعم. ابدأ بخطة مجانية وترقّ في أي وقت عند حاجة فريقك لمزيد من التخزين والتعاون والميزات المتقدمة.",
        },
      },
    },
    cta: {
      welcomeBackBadge: "مرحبًا بعودتك",
      welcomeBackTitle: "تابع الإنشاء",
      welcomeBackTitleAccent: "والتعاون",
      welcomeBackDesc: "عد إلى مساحة عملك وأدر تسجيلاتك.",
      startFreeBadge: "ابدأ مجانًا",
      startFreeTitle: "ابدأ التسجيل",
      startFreeTitleAccent: "في أقل من دقيقة",
      startFreeDesc: "أنشئ مساحة عملك، سجّل شاشتك، وتعاون مع فريقك — مباشرة من المتصفح.",
      signIn: "تسجيل الدخول",
    },
    dialogs: {
      workspaceRequiredSelect: "اختر مساحة عمل أولًا",
      workspaceRequiredCreate: "أنشئ مساحة عمل أولًا",
      workspaceRequiredSelectDesc: "لمتابعة الخطة المجانية، يرجى اختيار مساحة عمل.",
      workspaceRequiredCreateDesc: "ليس لديك مساحات عمل بعد. أنشئ واحدة لمتابعة الخطة المجانية.",
    },
    footer: { contact: "اتصل بنا", about: "من نحن", blogs: "المدونة" },
  },
  marketing: {
    contact: {
      supportDesc: "تواصل لمشاكل المنصة النشطة أو قفل حساب مساحة العمل أو أعطال معالجة الفيديو.",
      generalDesc: "راسلنا بخصوص ترقيات او اقتراحات للتطوير او استفسارات عن الموقع.",
      slaDesc: "نقرأ كل تذكرة يدويًا. معدل الاستجابة ضمن أطر زمنية تشغيلية معتادة.",
    },
    about: {
      originP1:
        "بدأ theRec.site لأنني احتجت منصة تسجيل شاشة سريعة فورًا وموثوقة وممتعة للاستخدام اليومي.",
      originP2:
        "أصبحت معظم الأدوات معقدة أو محجوبة بأسعار عالية أو موجهة لفرق مبيعات ضخمة. أردت بديلًا خفيفًا بلا احتكاك للمطورين والمبدعين والفرق الذين يحتاجون فقط:",
      bullet1: "بدء التسجيل فورًا من المتصفح",
      bullet2: "معالجة واستضافة فيديو عالي الدقة تلقائيًا",
      bullet3: "مشاركة روابط بنقرة واحدة بلا احتكاك",
      bullet4: "تنظيم تواصل الفريق في مساحات عمل نظيفة",
      originP3: "بدل انتظار إصلاح تجربة مشاركة الفيديو المعطوبة، قررت بناء الحل بنفسي.",
      transparentBody:
        "theRec.siteمنصة مستقلة تركز على منتج سريع وموثوق للناس الحقيقيين.",
      uxTitle: "مهووسون بسرعة تجربة المستخدم",
      uxBody:
        "كل ميزة تقلل وقت المشاركة. بإزالة القوائم المعقدة وتحسين العرض السحابي وتبسيط المُسجّل، تصبح سير العمل غير المتزامن سهلاً.",
      uxFooter: "مثالي لـ: تقارير الأخطاء والدروس وتحديثات الفريق السريعة.",
      frictionTitle: "سير عمل بلا احتكاك",
      frictionBody: "التقط واعرض وانشر روابط الفيديو بأقل نقرات.",
      collabTitle: "تعاون غير متزامن",
      collabBody: "مساحات عمل مشتركة مصممة لإبقاء الفرق الموزعة متوافقة.",
      iterationTitle: "تطوير مستمر",
      iterationBody: "تتطور بسرعة بناءً على ملاحظات المجتمع والفائدة العملية.",
      closingTitle: "أداة تواصل بُنيت بعناية.",
      closingBody:
        "لا فخاخ تسعير ديناميكية ولا زخارف غير ضرورية. منصة موثوقة للغاية تساعدك على التواصل بوضوح عبر فيديو فوري.",
      closingThanks: "شكرًا لكونك جزءًا من الرحلة.",
    },
    demo: {
      title: "عرض المنصة",
      subtitle: "شاهد كيف يعمل theRec من البداية للنهاية.",
      initBody:
        "ابدأ جلسات التسجيل فورًا دون إضافات. يلتقط المتصفح إطارات عالية الدقة وإعدادات الصوت المحلية دون تأخير إعداد.",
      encodingBody:
        "عند الإنهاء، ينتقل التسجيل إلى كتل عرض محسّنة في الخادم. تُنشأ صور مصغرة تلقائيًا وتتكيف البثوث مع الأجهزة.",
      distributionBody:
        "نظّم الفيديوهات في مساحات عمل قابلة للمشاركة. يُنسخ رمز المشاركة الآمن تلقائيًا لتقليل حلقة التواصل إلى نقرة واحدة.",
      ctaDesc: "أنشئ أول أصل في ثوانٍ. بلا بطاقات ائتمان ولا تثبيتات ثقيلة. تحديثات هندسية واضحة بلا احتكاك.",
      systemDemo: "فيديو عرض النظام",
    },
    blogs: {
      title: "المدونة",
      subtitle: "مقالات مفيدة للفرق التي تستخدم منصة تسجيل الشاشة.",
      articles: {
        a1: {
          title: "كيف يعمل تدفق تسجيل الشاشة في theRec",
          body: "يبدأ التسجيل بالالتقاط أو الرفع، ثم النقل متعدد الأجزاء والمعالجة والصور المصغرة والمخرجات القابلة للمشاركة. فهم هذا التدفق يساعد على تشخيص التأخير وتحسين الجودة.",
          p1: "مرحلة الالتقاط أو الرفع",
          p2: "نقل متعدد الأجزاء موثوق",
          p3: "المعالجة وتحديثات الحالة",
          p4: "الجاهزية والمشاركة",
        },
        a2: {
          title: "تسجيل الشاشة + الكاميرا مقابل مصدر واحد",
          body: "استخدم الشاشة والكاميرا عندما يفيد السياق أو الشخصية. استخدم الشاشة فقط للشروحات التقنية والكاميرا فقط للإعلانات السريعة.",
          p1: "شاشة + كاميرا للشروح والانضمام",
          p2: "شاشة فقط للجولات التقنية",
          p3: "كاميرا فقط لتحديثات الفريق",
          p4: "اختر حسب الجمهور والهدف",
        },
        a3: {
          title: "أهم حالات استخدام SaaS لتسجيل الشاشة",
          body: "تساعد المنصات عبر الهندسة والمنتج والتصميم والدعم والمبيعات. تقلل الاجتماعات وتوضح الرسالة بتحديثات مرئية موجزة.",
          p1: "الإبلاغ عن الأخطاء وإعادة إنتاج QA",
          p2: "عروض الميزات وتحديثات الإصدارات",
          p3: "ردود دعم العملاء",
          p4: "التدريب والانضمام الداخلي",
        },
        a4: {
          title: "أفضل ممارسات لتسجيلات عالية الجودة",
          body: "خطط رسالتك، اختصر الفيديو، وقلل الضوضاء البصرية. جودة المصدر الأفضل تقلل مشاكل المعالجة وتحسن الاحتفاظ.",
          p1: "ضع مخططًا واضحًا قبل التسجيل",
          p2: "اجعل الفيديو مركزًا على المهمة ومختصرًا",
          p3: "سجّل في بيئة هادئة",
          p4: "اضبط الرؤية قبل المشاركة",
        },
        a5: {
          title: "فهم حالات التسجيل ودورة الحياة",
          body: "يمر كل تسجيل بعدة حالات من الرفع إلى الجاهزية. معرفة معنى كل حالة يساعد على تتبع التقدم وتشخيص المشاكل.",
          p1: "جاري الرفع: نقل الأجزاء",
          p2: "المعالجة: التحويل والصور المصغرة",
          p3: "جاهز: الفيديو متاح بالكامل",
          p4: "فشل: أخطاء في الرفع أو المعالجة",
        },
        a6: {
          title: "كيفية تحسين أداء رفع الفيديو",
          body: "الرفع الفعال يحسن التجربة ويقلل الفشل. حجم الأجزاء والإعادة والشبكة حاسمة للملفات الكبيرة.",
          p1: "استخدم رفعًا متعدد الأجزاء للملفات الكبيرة",
          p2: "اختر أحجام أجزاء مناسبة (مثل 5 ميجابايت+)",
          p3: "نفّذ إعادة المحاولة للأجزاء الفاشلة",
          p4: "تتبع التقدم وتعامل مع انقطاع الشبكة",
        },
      },
    },
    subscriptionFlow: {
      badge: "سير عمل الاشتراك",
      title: "رقِّ مساحة عملك",
      titleAccent: "في دقائق",
      description: "تجربة فوترة واشتراك سلسة للفرق والمبدعين والشركات على منصة theRec.",
      previewAlt: "سير عمل الاشتراك",
      preview: "معاينة",
      steps: {
        s1: {
          title: "الاشتراك الحالي",
          desc: "بعد تسجيل الدخول، ينتقل المستخدم إلى صفحة الفوترة من الشريط الجانبي. تُعرض تفاصيل الاشتراك ودورة الفوترة والخطة والسجل.",
        },
        s2: {
          title: "اختر خطة",
          desc: "يمكن النقر على «غيّر خطتك» أو الترقية. تُعرض صفحة أسعار بكل الخطط مع خيارات شهرية وسنوية للمقارنة.",
        },
        s3: {
          title: "تأكيد الاشتراك",
          desc: "بعد اختيار الخطة، يُوجَّه المستخدم لتأكيد الفوترة المتكررة والموافقة على الشروط قبل المتابعة.",
        },
        s4: {
          title: "إدخال بيانات الفوترة",
          desc: "يظهر مربع حوار يطلب الاسم والبريد والبلد والمدينة والعنوان ورمز ترويجي اختياري.",
        },
        s5: {
          title: "المراجعة النهائية والدفع",
          desc: "تعرض صفحة المراجعة الخطة ودورة الفوترة والملخص. «متابعة للدفع» يوجّه إلى Checkout review  لإتمام الدفع بأمان.",
        },
      },
    },
  },
  legal: {
    terms: {
      s3Title: "3. فوترة الاشتراك والتجديد",
      s3Body:
        "تتجدد الخطط المدفوعة تلقائيًا حسب دورة الفوترة المختارة ما لم تُلغَ قبل تاريخ التجديد. تفوض الخصم المتكرر من وسيلة الدفع المحددة.",
      s4Title: "4. توفر الخدمة",
      s4Body:
        "نسعى لوقت تشغيل مرتفع لكن لا نضمن وصولًا دون انقطاع. قد تؤثر الصيانة أو أعطال الطرف الثالث أو القوة القاهرة على التوفر.",
      s5Title: "5. تحديد المسؤولية",
      s5Body:
        "في الحد الأقصى المسموح قانونًا، لا نتحمل أضرارًا غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام الخدمة.",
      s6Title: "6. التعديلات",
      s6Body: "قد نحدّث هذه الشروط. سُبل إخطار بالتغييرات الجوهرية عبر المنصة أو البريد عند الاقتضاء.",
      prohibitedList: {
        malware: "نشر برمجيات خبيثة أو محتوى مسيء",
        unauthorized: "وصول غير مصرح به للحسابات أو البيانات",
        harassment: "تحرش أو نشاط غير قانوني",
        circumvention: "تجاوز الحدود التقنية أو ضوابط الأمان",
      },
    },
    privacy: { contact: "لطلبات الخصوصية، تواصل معنا عبر صفحة الاتصال." },
  },
  recording: {
    subtitle: "تسجيل شاشة 1080p مع تحكم بالكاميرا/الميكروفون ورفع موثوق.",
    checklist: {
      title: "قائمة ما قبل التسجيل",
      browser: "المتصفح: {{browser}}. يمكنك مشاركة الشاشة كاملة أو نافذة أو تبويب.",
      audioTip: "نصيحة: لالتقاط صوت المواقع، شارك تبويب المتصفح وفعّل الصوت في مربع المشاركة",
    },
    status: {
      surface: "السطح",
      systemAudio: "صوت النظام",
      detected: "مُكتشف",
      notDetected: "غير مُكتشف",
      resolution: "الدقة",
      cameraPreview: "معاينة الكاميرا",
      pictureInPicture: "صورة داخل صورة",
      inPage: "في الصفحة",
      unknown: "غير معروف",
    },
    preview: { main: "المعاينة الرئيسية (الشاشة)" },
    controls: {
      pause: "إيقاف مؤقت",
      resume: "استئناف",
      restart: "إعادة بدء",
      stop: "إيقاف",
      startCountdown: "بدء العد التنازلي",
    },
    pip: { restart: "إعادة بدء", stop: "إيقاف" },
    processingOverlay: {
      finalizing: "جاري إنهاء التسجيل...",
      processing: "جاري معالجة التسجيل...",
      keepTabOpen: "يرجى إبقاء هذا التبويب مفتوحًا، قد تستغرق العملية دقائق.",
      estimatedWait: "الانتظار المتوقع: {{seconds}} ث",
    },
    workspaceDialog: {
      title: "مساحة عمل مطلوبة",
      description: "يرجى اختيار مساحة عمل قبل بدء التسجيل. إن لم تكن لديك واحدة، أنشئ مساحة عمل أولًا.",
      goWorkspaces: "الذهاب إلى مساحات العمل",
    },
    shareDialog: {
      title: "theRec",
      description: "اختر ما تريد مشاركته قبل بدء التسجيل.",
      shareTarget: "هدف المشاركة",
      systemSoundHint: "مفعّل افتراضيًا لالتقاط صوت التبويب/النظام.",
    },
    permissions: {
      title: "الأذونات",
      description: "أدر وصول الميكروفون والكاميرا لهذا التسجيل.",
      microphone: "الميكروفون",
      camera: "الكاميرا",
      permission: "الإذن",
      mergeLayout: "تخطيط دمج الكاميرا",
      mergeHint: "تُرسل هذه القيم للخادم لدمج الكاميرا بجانب الشاشة عبر FFmpeg.",
      position: "الموضع",
      shape: "الشكل",
      scale: "المقياس",
      positions: {
        topLeft: "أعلى يسار",
        topRight: "أعلى يمين",
        bottomLeft: "أسفل يسار",
        bottomRight: "أسفل يمين",
      },
    },
    camera: {
      dragHint: "اسحب لتحريك معاينة الكاميرا",
      continuesWithoutCamera: "يستمر التسجيل دون كاميرا.",
      continuesWithoutMic: "يستمر التسجيل دون ميكروفون.",
      uploadPartialFail:
        "حُفظ تسجيل الشاشة، لكن فشل إكمال مسار الكاميرا. يمكن إعادة معالجة الكاميرا من الخادم.",
    },
    countdown: { startsShortly: "سيبدأ التسجيل قريبًا.", draftRemoved: "تم حذف مسودة التسجيل." },
    processingDesc: "جاري معالجة تسجيلك.",
    noAudioHint: "لالتقاط صوت YouTube، شارك تبويب/نافذة المتصفح مع تفعيل الصوت في مربع المشاركة.",
    browserUnsupported: "هذا المتصفح لا يدعم تسجيل الشاشة.",
    defaultTitle: "تسجيل {{date}}",
    upload: {
      dropVideoOnly: "يرجى إسقاط ملف فيديو.",
      workspaceRequired: "مساحة عمل مطلوبة",
      processingDesc: "جاري معالجة الفيديو الآن.",
      cancelled: "تم إلغاء الرفع",
      cancelTitle: "إلغاء هذا الرفع؟",
      cancelDesc: "سيُوقف الرفع الحالي ويُلغى الرفع متعدد الأجزاء على الخادم ويُحذف مسودة التسجيل.",
      keepUploading: "متابعة الرفع",
      titlePlaceholder: "عنوان التسجيل",
    },
  },
  dashboard: {
    detail: {
      back: "رجوع",
      refresh: "تحديث",
      created: "أُنشئ {{date}}",
      size: "الحجم",
      duration: "المدة",
      mb: "ميجابايت",
      min: "دقيقة",
      visibility: "الرؤية",
      videoProcessing: "جاري معالجة الفيديو...",
      videoUnavailable: "معاينة الفيديو غير متاحة",
      resumingUpload: "جاري استئناف الرفع وإنهاء الأجزاء المرفوعة...",
      resumeUpload: "استئناف الرفع",
      download: "تنزيل",
      shareLink: "رابط المشاركة",
      removeWatermark: "إزالة العلامة المائية",
      retryProcessing: "إعادة المعالجة",
      moveToTrash: "نقل إلى سلة المهملات",
      deletePermanently: "حذف نهائي",
      planNoDownload: "خطتك الحالية لا تسمح بتنزيل الفيديو.",
      planNoWatermark: "خطتك الحالية لا تسمح بإزالة العلامة المائية.",
      privateShareBlocked: "لا يمكن مشاركة الفيديو لأنه خاص. اجعله عامًا أولًا.",
      linkCopied: "تم نسخ الرابط",
    },
  },
  billing: {
    dialog: {
      title: "بيانات الفوترة",
      description: "أكمل بيانات الفوترة لمتابعة إنشاء الاشتراك.",
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      phoneNumber: "رقم الهاتف",
      street: "الشارع",
      postalCode: "الرمز البريدي",
      country: "البلد",
      city: "المدينة",
      state: "الولاية/المحافظة",
      promoCode: "رمز ترويجي",
      continuePayment: "متابعة للدفع",
      loadingCountries: "جاري تحميل البلدان...",
      selectCountry: "اختر بلدًا",
      selectCountryFirst: "اختر البلد أولًا",
      loadingCities: "جاري تحميل المدن...",
      selectCity: "اختر مدينة",
      loadingStates: "جاري تحميل الولايات...",
      selectState: "اختر ولاية",
      promoPlaceholder: "أدخل رمزًا ترويجيًا (اختياري)",
      placeholders: {
        firstName: "أحمد",
        lastName: "محمد",
        email: "ahmad@company.com",
        street: "شارع 12",
        postalCode: "12345",
      },
      validation: {
        firstNameRequired: "الاسم الأول مطلوب",
        lastNameRequired: "اسم العائلة مطلوب",
        emailInvalid: "أدخل بريدًا إلكترونيًا صالحًا",
        phoneRequired: "رقم الهاتف مطلوب",
        phoneInvalid: "أدخل رقم هاتف دوليًا صالحًا",
        streetRequired: "الشارع مطلوب",
        postalRequired: "الرمز البريدي مطلوب",
        countryRequired: "اختر بلدًا",
        cityRequired: "المدينة مطلوبة",
        cityEnglish: "يجب أن تكون المدينة بالإنجليزية فقط",
        stateRequired: "الولاية مطلوبة",
        stateEnglish: "يجب أن تكون الولاية بالإنجليزية فقط",
      },
      errors: {
        countriesLoad: "تعذّر تحميل البلدان",
        countriesFailed: "فشل تحميل البلدان",
        citiesFailed: "فشل تحميل المدن",
        citiesInvalid: "استجابة مدن غير صالحة",
      },
    },
    workspaceDetails: {
      title: "اشتراك نشط",
      description: "الخطة الحالية لمساحة العمل المحددة.",
      emptySelection: "اختر مساحة عمل لعرض اشتراكها النشط.",
      workspaceLogo: "شعار {{name}}",
      workspaceFallback: "مساحة عمل",
      noData: "لا تتوفر بيانات اشتراك لمساحة العمل هذه.",
      na: "غ/م",
      unknownStatus: "غير معروف",
    },
  },
  workspaces: {
    subtitlePage: "تعاون مع فريقك",
    needOneDesc: "تحتاج مساحة عمل واحدة على الأقل للمتابعة.",
    invitePlaceholder: "زميل@company.com",
  },
  admin: {
    crud: {
      search: "بحث",
      create: "إنشاء",
      edit: "تعديل",
      delete: "حذف",
      details: "تفاصيل",
      refresh: "تحديث",
      save: "حفظ",
      cancel: "إلغاء",
      noResults: "لا توجد نتائج",
      confirmDelete: "حذف هذا العنصر؟",
      rowDetails: "تفاصيل الصف",
    },
    subscriptions: {
      refundAmountPrompt: "مبلغ الاسترداد (اتركه فارغًا للكامل):",
      refundReasonPrompt: "سبب الاسترداد (اختياري):",
      simulateRenewal: "محاكاة التجديد",
      applyFailure: "تطبيق حالة الفشل",
      submitRefund: "إرسال استرداد",
    },
    feedback: { title: "كل الملاحظات" },
    workspaceRecordings: { title: "تسجيلات مساحة العمل" },
    workspaceRecordingsLoadFailed: "فشل تحميل تسجيلات مساحة العمل",
    feedbackOverviewFailed: "فشل تحميل نظرة الملاحظات",
    feedbackListFailed: "فشل تحميل قائمة الملاحظات",
    promocodeCreated: "تم إنشاء الرمز الترويجي بنجاح.",
    promocodeUpdated: "تم تحديث الرمز الترويجي بنجاح.",
    promocodeCreateFailed: "تعذّر إنشاء الرمز الترويجي.",
    promocodeUpdateFailed: "تعذّر تحديث الرمز الترويجي.",
    promocodeNoChanges: "لم تُحدَّث حقول الرمز الترويجي.",
    recordingCreated: "تم إنشاء التسجيل",
    recordingCreatedDesc: "تم إنشاء التسجيل بنجاح.",
    recordingUpdated: "تم تحديث التسجيل",
    recordingUpdatedDesc: "تم تحديث التسجيل بنجاح.",
    filterByTitle: "تصفية حسب العنوان",
    filterByStatus: "تصفية حسب الحالة",
    filterByVisibility: "تصفية حسب الرؤية",
    filterEventType: "تصفية نوع الحدث",
    filterByRating: "تصفية حسب التقييم",
    websiteSuccessFilter: "تصفية نجاح الموقع",
    integrityIncomplete: "اشتراكات Paymob غير مكتملة: {{count}}",
    repairResult: "نتيجة الإصلاح ← أعيد الربط: {{relinked}}، غير محلول: {{unresolved}}، مُعلَّم غير صالح: {{markedInvalid}}",
    repairRelinked: "أُعيد ربط {{relinked}}، غير محلول {{unresolved}}.",
    repairMarkedInvalid: "مُعلَّم غير صالح {{markedInvalid}}.",
    analytics: {
      recordingCreated: "تم إنشاء التسجيل",
      recordingCompleted: "اكتمل التسجيل",
      completed: "مكتمل",
      remaining: "متبقي",
    },
    unexpectedError: "خطأ غير متوقع",
    requestFailed: "فشل الطلب",
    success: "نجاح",
    failed: "فشل",
    noChanges: "لا تغييرات",
    planLabel: "{{name}} (المعرّف: {{id}})",
    userUnknown: "غير معروف",
  },
};

const NAMESPACES = [
  "common",
  "auth",
  "layout",
  "home",
  "dashboard",
  "billing",
  "workspaces",
  "recording",
  "profile",
  "marketing",
  "legal",
  "admin",
  "errors",
];

const beforeCounts = {};
for (const ns of NAMESPACES) {
  beforeCounts[ns] = countKeys(loadJson("en", ns));
}

for (const ns of NAMESPACES) {
  const enBase = loadJson("en", ns);
  const arBase = loadJson("ar", ns);
  const enMerged = EN_ADDITIONS[ns] ? deepMerge(enBase, EN_ADDITIONS[ns]) : enBase;
  const arMerged = AR_ADDITIONS[ns] ? deepMerge(arBase, AR_ADDITIONS[ns]) : arBase;
  writeJson("en", ns, enMerged);
  writeJson("ar", ns, arMerged);
}

const added = {};
for (const ns of NAMESPACES) {
  const after = countKeys(loadJson("en", ns));
  added[ns] = after - beforeCounts[ns];
}

// Verify key structure parity
let mismatch = false;
for (const ns of NAMESPACES) {
  const enKeys = JSON.stringify(Object.keys(loadJson("en", ns)).sort());
  const arKeys = JSON.stringify(Object.keys(loadJson("ar", ns)).sort());
  if (enKeys !== arKeys) {
    console.error(`Top-level key mismatch in ${ns}`);
    mismatch = true;
  }
}

function allLeafPaths(obj, prefix = "") {
  const paths = [];
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      paths.push(...allLeafPaths(obj[k], p));
    } else {
      paths.push(p);
    }
  }
  return paths.sort();
}

for (const ns of NAMESPACES) {
  const enP = new Set(allLeafPaths(loadJson("en", ns)));
  const arP = new Set(allLeafPaths(loadJson("ar", ns)));
  const onlyEn = [...enP].filter((p) => !arP.has(p));
  const onlyAr = [...arP].filter((p) => !enP.has(p));
  if (onlyEn.length || onlyAr.length) {
    console.error(`Leaf path mismatch in ${ns}: en-only=${onlyEn.length} ar-only=${onlyAr.length}`);
    mismatch = true;
  }
}

console.log("Keys added per namespace (en):");
for (const ns of NAMESPACES) {
  console.log(`  ${ns}: +${added[ns]} (total ${countKeys(loadJson("en", ns))})`);
}
if (mismatch) process.exit(1);
console.log("en/ar structure verified.");
