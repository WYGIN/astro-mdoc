import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { unknown } from 'astro/zod';
declare module 'virtual:wygin/user-config' {
    const Config: import('./utils/userConfig').MarkdocUserConfig;
    export default Config;
}

declare module 'virtual:wygin/markdoc-unique-imports' {
    const Config: any
    export default Config
}

declare module 'virtual:wygin/markdoc-config' {
    const Config: import('@markdoc/markdoc').Config;
    export default Config;
}

declare module 'virtual:wygin/project-context' {
    const Config: { root: string };
    export default Config;
}

declare module 'virtual:wygin/acf-component' {
    const Config: AstroComponentFactory
    export default Config
}

declare module 'virtual:wygin/astro-markdoc-ssr-renderer' {
    const Config: Promise<AstroComponentFactory>
    export default Config;
}