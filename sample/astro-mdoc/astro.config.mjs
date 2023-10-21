import { defineConfig } from 'astro/config';

import mdoc from "astro-mdoc";

// https://astro.build/config
export default defineConfig({
  integrations: [mdoc()]
});