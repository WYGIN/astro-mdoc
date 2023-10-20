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
	[...acfMap].forEach(([key, value]) => StringifiedMap +=`${JSON.stringify(key)}: ${typeof value === 'function' ? value.toString() : JSON.stringify(value) },\n` )
    const modules = {
        'virtual:wygin/user-config': `export default ${JSON.stringify(options)}`,
        'virtual:wygin/markdoc-unique-imports': `
			const Obj = {
				${StringifiedMap}
			}
			export default Obj
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
			import { MdocRender, isObject, MdocDeepRender } from 'astro-mdoc/src/components/MarkdocRender.ts';
			import { isAstroComponentFactory } from "astro/runtime/server/render/astro/factory.js";
			import { UniqueImports } from 'astro-mdoc/src/virtual/imports.js';
			import { isStringOrNumber, isNullOrIsNotObjectOrIsNotTag, isPropagatedAssetsModule, isFunction, ComponentNode } from 'astro-mdoc/src/components/TreeNode.ts';
			import MarkdownIt from 'markdown-it';
			const { escapeHtml } = MarkdownIt().utils;

			async function createTreeNode(node) {
				const wygName = node?.name;

				if (isHTMLString(node)) {
					return { type: 'text', content: node };
				} else if (isStringOrNumber(node)) {
					return { type: 'text', content: node };
				} else if (isNullOrIsNotObjectOrIsNotTag(node)) {
					return { type: 'text', content: '' };
				}
			
				const children = await Promise.all(node?.children?.map(async(child) => await createTreeNode(child)));
			
				if (isFunction(node)) {
					const component = wygName;
					const props = node?.attributes;
			
					return {
						type: 'component',
						component,
						props,
						children,
					};
				} else if (isPropagatedAssetsModule(node.name)) {
					const { collectedStyles, collectedLinks, collectedScripts } = node.name;
					const component = (await node.name.getMod()).default;
					const props = node?.attributes;
			
					return {
						type: 'component',
						component,
						collectedStyles,
						collectedLinks,
						collectedScripts,
						props,
						children,
					};
				} else if(wygName in UniqueImports) {
					const ComponentImport = await import(UniqueImports[wygName]);
					const namedImport = ComponentImport[wygName]['render'] ?? wygName;
					const component = createComponent({
						factory(result) {
							const slots = {
								default: () =>
									render\`\${children.map((child) =>
										renderComponent(result, 'ComponentNode', ComponentNode, { treeNode: child })
									)}\`,
							};
							let styles = '',
							links = '',
							scripts = '';
							if (Array.isArray(node?.collectedStyles)) {
								styles = node?.collectedStyles
									.map((style) =>
										renderUniqueStylesheet(result, {
											type: 'inline',
											content: style,
										})
									)
									.join('');
							}
							if (Array.isArray(node?.collectedLinks)) {
								links = node?.collectedLinks
									.map((link) => {
										return renderUniqueStylesheet(result, {
											type: 'external',
											src: link[0] === '/' ? link : '/' + link,
										});
									})
									.join('');
							}
							if (Array.isArray(node?.collectedScripts)) {
								scripts = node?.collectedScripts
									.map((script) => renderScriptElement(script))
									.join('');
							}

							const head = unescapeHTML(styles + links + scripts);

							let headAndContent = createHeadAndContent(
								head,
								renderTemplate\`\${renderComponent(
									result,
									wygName,
									namedImport,
									node?.attributes,
									slots
								)}\`
							);

							const propagators = result._metadata.propagators || result.propagators;
							propagators.add({
								init() {
									return headAndContent;
								},
							});
				
							return headAndContent;
						},
						// moduleId: namedImport?.name ?? wygName,
						// propagation: 'self'
					})
					return {
						type: 'component',
						component,
						props: node?.attributes,
						children,
					};
				} else {
					return {
						type: 'element',
						tag: node?.name,
						attributes: node?.attributes,
						children,
					};
				}
			}

			export default async function AcfComponent(node) {
				const name = node?.name;
				const attributes = node.attributes;
				const children = node?.children ?? []
				const slot = await Promise.resolve(MdocDeepRender({ node: node?.children ?? [] }))
				const importedFun = UniqueImports[name];

				if(Array.isArray(node)) {
					return await Promise.all(node.map(async n => {
						const treeNode = await createTreeNode(n);
						// console.log('AcfComponent:Array ->', treeNode);
						return createComponent({
							factory(result) {
								return renderTemplate\`\${renderComponent(result, 'ComponentNode', ComponentNode, { treeNode })}\`;
							},
							moduleId: name,
							propagation: 'self'
						})
					}))
				} else {
					const treeNode = await createTreeNode(node);
					// console.log('AcfComponent:single ->', treeNode);
					return await Promise.resolve(createComponent({
						factory(result) {
							return renderTemplate\`\${renderComponent(result, 'ComponentNode', ComponentNode, { treeNode })}\`;
						},
						moduleId: name,
						propagation: 'self'
					}))
				}
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
			import { MdocRender, MdocDeepRender } from 'astro-mdoc/src/components/MarkdocRender.ts';

			${[...acfMap].forEach(([key, value]) => {
				return `let ${key} = ${value}`
			})}

			export default async function MdocParser({ source }) {
				const ast = Markdoc.parse(source);
				// console.log('ast', ast);
				const errors = Markdoc.validate(ast, MarkdocConfig);
				if (!errors) return errors
				const content = Markdoc.transform(ast, MarkdocConfig);

				if(Array.isArray(content)) {
					const res = await Promise.resolve(MdocDeepRender({ node: content }));
					return res
				} else {
					const res = await Promise.resolve(MdocRender({ node: content }));
					return res
				}
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