import type { ViteUserConfig } from "astro/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroConfig } from "astro";
import type { MarkdocUserConfig } from '../utils/userConfig';
import type { Config } from "@markdoc/markdoc";
import { acfMap } from "../factory/acfMap";

function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
	return `\0${id}`;
}

export function vitePluginAstroMarkdocSSR(options: MarkdocUserConfig, { root }: Pick<AstroConfig, 'root'>, markdocConfig: Config): NonNullable<ViteUserConfig['plugins']>[number] {
    const resolveId = (id: string) => JSON.stringify(id.startsWith('.') ? resolve(fileURLToPath(root), id) : id);
    const modules = {
        'virtual:wygin/user-config': `export default ${JSON.stringify(options)}`,
        'virtual:wygin/markdoc-unique-imports': `export default ${JSON.stringify(acfMap)}`,
        'virtual:wygin/markdoc-config': `export default ${JSON.stringify(markdocConfig)}`,
        'virtual:wygin/project-context': `export default ${JSON.stringify(root)}`,
		'virtual:wygin/acf-component': `
			import { 
				createComponent,
				renderComponent,
				render,
				renderScriptElement,
				renderUniqueStylesheet,
				createHeadAndContent,
				unescapeHTML,
				renderTemplate,
				HTMLString,
				isHTMLString,
			} from 'astro/runtime/server/index.js';
			import { UniqueImports } from 'astro-mdoc/src/virtual/index.ts';
			export default function AcfComponent(node) {
				const wygComponent = [...UniqueImports].find(node.name);
				return createComponent({
					factory(result) {
						return renderTemplate\`\${renderComponent(result, node.name ?? 'div', wygComponent, node.attributes, node.children)}\`;
					}
				})
			}
		`,
		'virtual:wygin/astro-markdoc-ssr-renderer': `
			import Markdoc from '@markdoc/markdoc';
			import { MarkdocConfig } from 'astro-mdoc/src/virtual/index.js';
			import {
				createComponent,
				renderComponent,
				render,
				renderScriptElement,
				renderUniqueStylesheet,
				createHeadAndContent,
				unescapeHTML,
				renderTemplate,
				HTMLString,
				isHTMLString,
			} from 'astro/runtime/server/index.js';
			import { createTreeNode, ComponentNode } from 'astro-mdoc/src/components/TreeNode.ts';
			import { MdocRender } from 'astro-mdoc/src/components/MarkdocRender.ts';

			${[...acfMap].forEach(([key, value]) => {
				return `let ${key} = ${value}`
			})}

			export default function MdocParser({ source }) {
				const ast = Markdoc.parse(source);
				const errors = Markdoc.validate(ast, MarkdocConfig);
				if (!errors) return errors
				const content = Markdoc.transform(ast, MarkdocConfig);

				return MdocRender({ node: content })
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