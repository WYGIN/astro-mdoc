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
	let StringifiedMap = '';
	const Obj = [...acfMap].forEach(([key, value]) => StringifiedMap +=`${JSON.stringify(key)}: ${typeof value === 'function' ? value.toString() : JSON.stringify(value) },\n` )
	console.log('StringifiedMap: ', StringifiedMap)
    const modules = {
        'virtual:wygin/user-config': `export default ${JSON.stringify(options)}`,
        'virtual:wygin/markdoc-unique-imports': `
			const Obj = {
				${StringifiedMap}
			}
			export default Obj
			${console.log('\n\n\n\n\n\n\n\n\n\n\n\n\nacfMapArray: ',[...acfMap].forEach(([key, value]) => `${JSON.stringify(key)}: ${typeof value === 'function' ? value.toString() : JSON.stringify(value) },\n` ))}
		`,
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
			import { MdocRender, isPropagatedAssetsModule, isFunction, isObject } from 'astro-mdoc/src/components/MarkdocRender.ts';
			import { isAstroComponentFactory } from "astro/runtime/server/render/astro/factory.js";
			import { UniqueImports } from 'astro-mdoc/src/virtual/imports.js';
			export default async function AcfComponent(node) {
				const name = node?.name;
				const slot = await Promise.resolve(MdocRender({ node: node?.children }))
				console.log('UniqueImports: has keys? -> ', name in UniqueImports)
				const importedFun = UniqueImports[name];
				console.log()
				const comp = createComponent({
					factory(result) {
						let styles = '',
						links = '',
						scripts = '';
				
						const head = unescapeHTML(styles + links + scripts);
				
						let headAndContent = createHeadAndContent(
							head,
							renderTemplate\`\${renderComponent(
								result,
								name,
								importedFun ?? name,
								node?.attributes,
								slot
							)}\`
						);
				
						const propagators = result._metadata.propagators || result.propagators;
						propagators.add({
							init() {
								return headAndContent;
							},
						});
				
						return headAndContent;
					}
				})
				console.log('uniqueImports', UniqueImports[name])
				return comp
			}
		`,
		'virtual:wygin/astro-markdoc-ssr-renderer': `
			import Markdoc from '@markdoc/markdoc';
			import { MarkdocConfig } from 'astro-mdoc/src/virtual/imports.js';
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
			import { MdocRender } from 'astro-mdoc/src/components/MarkdocRender.ts';

			${[...acfMap].forEach(([key, value]) => {
				return `let ${key} = ${value}`
			})}

			export default async function MdocParser({ source }) {
				const ast = Markdoc.parse(source);
				const errors = Markdoc.validate(ast, MarkdocConfig);
				if (!errors) return errors
				const content = Markdoc.transform(ast, MarkdocConfig);

				const res = await Promise.resolve(MdocRender({ node: content }));
				return res
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