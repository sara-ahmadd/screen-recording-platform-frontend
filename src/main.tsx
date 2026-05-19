import "./index.css";

if (typeof window !== "undefined") {
  await (await import("@/lib/siteBootstrapReset")).runSiteBootstrapReset();
}

const { ViteReactSSG } = await import("vite-react-ssg");
const { routes } = await import("./App.tsx");

export const createRoot = ViteReactSSG({
  routes,
  basename: import.meta.env.BASE_URL,
});
