import { ViteReactSSG } from "vite-react-ssg";
import { registerSW } from "virtual:pwa-register";
import { routes } from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
  registerSW({ immediate: true });
}


export const createRoot = ViteReactSSG({
  routes,
  basename: import.meta.env.BASE_URL,
});
