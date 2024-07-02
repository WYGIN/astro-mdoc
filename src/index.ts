import type { AstroIntegration } from "astro";
import type { MarkdocUserConfig } from "./utils/user-config";
import { markdocUserConfig } from "./config";
import { vitePluginAstroMarkdocSSR } from "./vite/mdoc-ssr";

export default function AstroMarkdocSSR(options: MarkdocUserConfig): AstroIntegration {
    return AstroMarkdocSSRConfig({ options })
}

const AstroMarkdocSSRConfig = ({ options= {
    allowHTML: false,
    markdocPath: '/src/markdoc'
} }: { options: MarkdocUserConfig}): AstroIntegration => {
    return {
        'name': 'astro-mdoc',
        hooks: {
            'astro:config:setup': async ({ config, updateConfig }) => {
                const mdocConfig = await Promise.resolve(markdocUserConfig(config, options?.markdocPath))
                const userConfig = {
                    vite: {
                        plugins: [vitePluginAstroMarkdocSSR(options, config, mdocConfig)]
                    }
                };
                updateConfig(userConfig);
            }
        }
    }
}
