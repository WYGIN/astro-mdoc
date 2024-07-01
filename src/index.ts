import type { AstroConfig, AstroIntegration } from "astro";
import type { MarkdocUserConfig } from "./utils/user-config";

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
            }
        }
    }
}
