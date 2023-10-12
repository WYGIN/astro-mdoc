import type { ViteUserConfig } from "astro/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroConfig } from "astro";
import type { MarkdocUserConfig } from '../utils/userConfig';
import { ACFMap } from "../factory/acfMap";
import type { Config } from "@markdoc/markdoc";
import { defineConfig } from 'vite';

function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
	return `\0${id}`;
}

export function vitePluginAstroMarkdocSSr(options: MarkdocUserConfig, { root }: Pick<AstroConfig, 'root'>, markdocConfig: Config): NonNullable<ViteUserConfig['plugins']>[number] {
    const resolveId = (id: string) => JSON.stringify(id.startsWith('.') ? resolve(fileURLToPath(root), id) : id);
    const modules = {
        'virtual:wygin/user-config': `export default ${JSON.stringify(options)}`,
        'virtual:wygin/markdoc-unique-imports': `export default ${JSON.stringify(ACFMap.get())}`,
        'virtual:wygin/markdoc-config': `export default ${JSON.stringify(markdocConfig)}`,
        'virtual:wygin/project-context': `export default ${JSON.stringify(root)}`,
		'virtual:wygin/astro-markdoc-ssr-renderer': `---
			${ACFMap.get().forEach(item => {
				return `const ${item.name} = ${item}`
			})}
			import type { Config } from '@markdoc/markdoc';
			import Markdoc from '@markdoc/markdoc';
			import { ComponentNode, createTreeNode } from 'astro-markdoc-ssr/components/TreeNode.js';
			import config from 'virtual:wygin/markdoc-config';
			interface Props = {
				source: string;
			}
			const { source } = Astro.props as Props;
			const ast = Markdoc.parse(source);
			const content = Markdoc.transform(ast, config);
			---
			{
				Array.isArray(content) ? (
					content.map(async (c) => <ComponentNode treeNode={await createTreeNode(c)} />)
				) : (
					<ComponentNode treeNode={await createTreeNode(content)} />
				)
			}
		`,
    } satisfies Record<string, string>;

    	/** Mapping names prefixed with `\0` to their original form. */
	const resolutionMap = Object.fromEntries(
		(Object.keys(modules) as (keyof typeof modules)[]).map((key) => [
			resolveVirtualModuleId(key),
			key,
		])
	);

    return {
        name: 'vite-plugin-astro-markdoc-ssr-config',
		resolveId(id): string | void {
			if (id in modules) return resolveVirtualModuleId(id);
		},
		load(id): string | void {
			const resolution = resolutionMap[id];
			if (resolution) return modules[resolution];
		},
    }
}