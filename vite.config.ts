import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/android/*.png",
        "icons/ios/*.png",
        "icons/windows11/*.png"
      ],
      manifest: {
        name: "VocabDeck",
        short_name: "VocabDeck",
        description: "Master vocabulary with quick, fun quiz rounds",
        theme_color: "#2B2B2B",
        background_color: "#2B2B2B",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/android/android-launchericon-48-48.png",
            sizes: "48x48",
            type: "image/png"
          },
          {
            src: "icons/android/android-launchericon-72-72.png",
            sizes: "72x72",
            type: "image/png"
          },
          {
            src: "icons/android/android-launchericon-96-96.png",
            sizes: "96x96",
            type: "image/png"
          },
          {
            src: "icons/android/android-launchericon-144-144.png",
            sizes: "144x144",
            type: "image/png"
          },
          {
            src: "icons/android/android-launchericon-192-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/android/android-launchericon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/android/android-launchericon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/ios/180.png",
            sizes: "180x180",
            type: "image/png"
          },
          {
            src: "icons/ios/512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "icons/ios/1024.png",
            sizes: "1024x1024",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-css",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
