import type { AstroConfig, AstroInstance } from "astro";
import { type MarkdocPath, getMarkdocPath } from "./utils/user-config";
import { getNodes } from "./utils/get-nodes";
import type {
	Config,
	ConfigType as MarkdocConfig,
	NodeType,
	Schema,
} from '@markdoc/markdoc';

export const markdocUserConfig = async ({ root }: AstroConfig, path?: MarkdocPath): Promise<Config> => {
    const { nodes, tags, partials, variables, functions } = getMDocFiles(root, path);
    const n = await Promise.resolve(getNodes(nodes, root, true))
    const t = await Promise.resolve(getNodes(tags, root, true))
    const p = await Promise.resolve(getNodes(partials, root, false))
    const v = await Promise.resolve(getNodes(variables, root, false))
    const f = await Promise.resolve(getNodes(functions, root, false))
    return {
        nodes: n,
        tags: t,
        partials: p,
        variables: v ,
        functions: f,
    }
}

const getMDocFiles = ( root: AstroConfig['root'], path?: MarkdocPath) => {
    const mdocPath = getMarkdocPath(path);
    const tags: URL = new URL((mdocPath.tags as string).slice(1), root);
    const nodes: URL = new URL((mdocPath.nodes as string).slice(1), root);
    const partials: URL = new URL((mdocPath.partials as string).slice(1), root);
    const variables: URL = new URL((mdocPath.variables as string).slice(1), root);
    const functions: URL = new URL((mdocPath.functions as string).slice(1), root);
    return { nodes, tags, variables, functions, partials }
}

export type Render = AstroInstance['default'];

export type AstroMarkdocConfig = MarkdocConfig & {
	tags?: Record<string, Schema<Config, Render>>
	nodes?: Partial<Record<NodeType, Schema<Config, Render>>>
}

export type ResolvedAstroMarkdocConfig = Omit<AstroMarkdocConfig, 'extends'>;
