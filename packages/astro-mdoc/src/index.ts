import type { AstroConfig, AstroIntegration } from "astro";
import type { MarkdocUserConfig } from "./utils/userConfig";
import type { AstroUserConfig } from "astro/config";
import { vitePluginAstroMarkdocSSr } from "./vite/astroMarkdocSSR";
import * as fs from 'node:fs';
import { getMarkdocPath, type MarkdocPath } from "./utils/userConfig";
import type { Config } from "@markdoc/markdoc";
import { getNamedImport } from "./utils/namedImports";
import { fileURLToPath } from "node:url";
import { ACFMap } from "./factory/acfMap";

export default function AstroMarkdocSSR(options: MarkdocUserConfig): AstroIntegration {
    return AstroMarkdocSSRConfig({ options })
}

const AstroMarkdocSSRConfig = ({ options= {
    allowHTML: false,
    markdocPath: '/src/markdoc'
} }: { options: MarkdocUserConfig}): AstroIntegration => {
    return {
        'name': 'astro-markdoc-ssr',
        hooks: {
            'astro:config:setup': ({ config, updateConfig }) => {
                const userConfig: AstroUserConfig = {
                    vite: {
                        plugins: [vitePluginAstroMarkdocSSr(options, config, markdocUserConfig(config, options?.markdocPath))]
                    }
                };
                updateConfig(userConfig);
            }
        }
    }
}

const getNodes = async (nodes : URL[], isNode: boolean) => {
    let nodeArray = nodes.map(async file => {
        const obj = await import(fileURLToPath(file));
        const namedImport = getNamedImport(obj);
        if(isNode) {
            const component = ACFMap.add(obj[namedImport]);
            return { [namedImport] : obj[namedImport] & { render: component.name } as any };
        }
        return { [namedImport]: obj[namedImport] as any };
    });

    return await Promise.all(nodeArray);
}

export const markdocUserConfig = ({ root }: AstroConfig, path?: MarkdocPath): Config => {
    const { nodes, tags, partials, variables, functions } = getMDocFiles(root, path);
    const n = (async () => await getNodes(nodes, true))
    const t = (async () => await getNodes(tags, true))
    const p = (async () => await getNodes(partials, false))
    const v = (async () => await getNodes(variables, false))
    const f = (async () => await getNodes(functions, false))
    return {
        nodes: { ...n },
        tags: { ...t },
        partials: { ...p },
        variables: { ...v },
        functions: { ...f },
    }
}

const getMDocFiles = ( root: AstroConfig['root'], path?: MarkdocPath) => {
    const mdocPath = getMarkdocPath(path);
    const tags: URL[] | undefined= getFilesWithExtentions(new URL(root.pathname + mdocPath.tags, root), markdocFileRegex);
    const nodes: URL[] | undefined= getFilesWithExtentions(new URL(root.pathname + mdocPath.nodes, root), markdocFileRegex);
    const partials: URL[] | undefined= getFilesWithExtentions(new URL(root.pathname + mdocPath.partials, root), markdocFileRegex);
    const variables: URL[] | undefined= getFilesWithExtentions(new URL(root.pathname + mdocPath.variables, root), markdocFileRegex);
    const functions: URL[] | undefined= getFilesWithExtentions(new URL(root.pathname + mdocPath.functions, root), markdocFileRegex);

    return { nodes, tags, variables, functions, partials }
}

const markdocFiles: Array<URL> = [];
const markdocFileRegex = /\.(md|mdoc)$/;

const getFilesWithExtentions = (dir: string | URL, extentions: RegExp) => {
    if(fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for(const file of files) {
            const filepath = new URL(file, dir);
            if(fs.statSync(filepath).isDirectory()) {
                getFilesWithExtentions(filepath, extentions);
            } else {
                if(extentions.test(filepath.href)) {
                    markdocFiles.push(filepath);
                }
            }
        }
    }
    const fileList = markdocFiles;
    markdocFiles.length = 0;
    return fileList;
}
