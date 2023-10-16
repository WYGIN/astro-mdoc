import { defineConfig } from 'astro/config';
import astroMdoc from 'astro-mdoc';
import react from '@astrojs/react';
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
    output: "server",
    adapter: cloudflare(),
    integrations: [react(), astroMdoc()]
});
