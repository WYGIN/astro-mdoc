import { defineConfig } from 'astro/config';
import mdoc from "astro-mdoc";
import react from "@astrojs/react";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdoc()],
  output: "server",
  adapter: vercel()
});