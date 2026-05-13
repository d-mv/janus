import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    base: "/",
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
            includeAssets: ["favicon.ico", "favicon-192.png", "favicon-180-precomposed.png", "favicon-32.png"],
            manifest: {
                name: "PWA OpenAPI Viewer",
                short_name: "OpenAPI Viewer",
                description: "Client-side OpenAPI viewer with shareable compressed links",
                theme_color: "#0f172a",
                background_color: "#0f172a",
                display: "standalone",
                start_url: "/",
                scope: "/",
                icons: [
                    {
                        src: "favicon-36.png",
                        sizes: "36x36",
                        type: "image/png"
                    },
                    {
                        src: "favicon-48.png",
                        sizes: "48x48",
                        type: "image/png"
                    },
                    {
                        src: "favicon-72.png",
                        sizes: "72x72",
                        type: "image/png"
                    },
                    {
                        src: "favicon-96.png",
                        sizes: "96x96",
                        type: "image/png"
                    },
                    {
                        src: "favicon-192.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "favicon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "maskable"
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
