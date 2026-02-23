import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    var _a;
                    if (!id.includes("node_modules")) {
                        return undefined;
                    }
                    var path = id.split("node_modules/")[1];
                    if (!path) {
                        return undefined;
                    }
                    var segments = path.split("/");
                    var packageName = segments[0].startsWith("@")
                        ? "".concat(segments[0], "-").concat((_a = segments[1]) !== null && _a !== void 0 ? _a : "pkg")
                        : segments[0];
                    return "lib-".concat(packageName.replace(/[^a-zA-Z0-9_-]/g, "_"));
                },
            },
        },
    },
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg"],
            manifest: {
                name: "PWA OpenAPI Viewer",
                short_name: "OpenAPI Viewer",
                description: "Client-side OpenAPI viewer with shareable compressed links",
                theme_color: "#0f172a",
                background_color: "#0f172a",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "/favicon.svg",
                        sizes: "64x64",
                        type: "image/svg+xml"
                    }
                ]
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "cdn-assets",
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            }
                        }
                    }
                ]
            }
        })
    ]
});
