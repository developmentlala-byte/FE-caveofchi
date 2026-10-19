// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync, statSync } from "node:fs";
export default defineNuxtConfig({
  modules: ["shadcn-nuxt"],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "http://localhost:8000",
    },
  },
  routeRules: {
    "/backend/**": {
      proxy: "https://design.langitlangit.id/backend/**",
    },
  },
  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: "@/components/ui",
  },
  css: ["~/assets/css/tailwind.css"],
  vite: {
    optimizeDeps: {
      include: [
        "@dnd-kit/abstract/modifiers",
        "@phosphor-icons/vue",
        "@tanstack/vue-table",
        "@unovis/vue",
        "@vueuse/core",
        "class-variance-authority",
        "clsx",
        "dnd-kit-vue",
        "reka-ui",
        "tailwind-merge",
        "zod",
      ],
    },
    vue: {
      script: {
        fs: {
          fileExists: (file: string) =>
            existsSync(file) && statSync(file).isFile(),
          readFile: (file: string) =>
            existsSync(file) && statSync(file).isFile()
              ? readFileSync(file, "utf-8")
              : undefined,
        },
      },
    },

    plugins: [tailwindcss()],
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
});
