import type { RenderableTreeNodes, NodeType, Node, Primitive, Scalar, RenderableTreeNode } from "@markdoc/markdoc/src/types";
import Tag from "@markdoc/markdoc/src/tag"
import { 
    createComponent, 
    type AstroComponentFactory,
    renderComponent,
    render,
    renderScriptElement,
    renderUniqueStylesheet,
    createHeadAndContent,
    unescapeHTML,
    renderTemplate,
    HTMLString,
    isHTMLString, 
} from "astro/runtime/server/index.js";
import MarkdownIt from 'markdown-it';
import type { AstroInstance } from "astro";
const { escapeHtml } = MarkdownIt().utils;
import { AcfComponents } from '../virtual/imports.js'

export async function MdocDeepRender({ node } : { node : RenderableTreeNodes }): Promise<AstroComponentFactory[]> {
    if(isRenderableTreeNode(node) || !Array.isArray(node)) {
        return [await MdocRender({ node })]
    } else {
        const comp = await Promise.all(node.map(async n => {
            const c = await MdocRender({ node: n })
            return c
        }))
        return comp
    }
}

export async function MdocRender({ node } : { node : RenderableTreeNode }): Promise<AstroComponentFactory> {

    if(isHTMLString(node)) {
        const comp = createComponent({
            factory() {
                return render`${new HTMLString(node)}`
            },
            moduleId: 'isHTMLString',
            propagation: 'self'
        })
        return comp
    }

    if(typeof node === 'string' || typeof node === 'number') {
        const comp = createComponent({
            factory() {
                return render`${escapeHtml(String(node))}`
            },
            moduleId: 'isStringOrNumber',
            propagation: 'self'
        })
        return comp
    }

    if(node === null || typeof node !== 'object' || !Tag.isTag(node)) {
        const comp = createComponent({
            factory() {
                return render``
            }
        })
        return comp
    }

    const childNodes = await Promise.all(node.children.map(child => MdocRender({ node: child })))

    if(isFunction(node.name) || typeof node.name === 'function') {
        const component = node.name;
		const props = node.attributes;

        const comp = createComponent({
            factory(result: any) {
                let headAndContent = createHeadAndContent(
                    String('') as any,
                    renderTemplate`${renderComponent(
                        result,
                        component.name,
                        component,
                        props,
                        childNodes
                    )}`
                );

                const propagators = result._metadata.propagators || result.propagators;
                propagators.add({
                    init() {
                        return headAndContent;
                    },
                });
    
                return headAndContent;
            },
            moduleId: component.name ?? 'isFunction',
            propagation: 'self'
        })

        return comp
    } else if (isPropagatedAssetsModule(node.name)) {
        const { collectedStyles, collectedLinks, collectedScripts } = node.name;
		const component = (await node.name.getMod()).default;
		const props = node.attributes;

        const comp = createComponent({
            factory(result: any) {
                let styles = '',
                links = '',
                scripts = '';

                if (Array.isArray(collectedStyles)) {
                    styles = collectedStyles
                        .map((style: any) =>
                            renderUniqueStylesheet(result, {
                                type: 'inline',
                                content: style,
                            })
                        )
                        .join('');
                }
                if (Array.isArray(collectedLinks)) {
                    links = collectedLinks
                        .map((link: any) => {
                            return renderUniqueStylesheet(result, {
                                type: 'external',
                                src: link[0] === '/' ? link : '/' + link,
                            });
                        })
                        .join('');
                }
                if (Array.isArray(collectedScripts)) {
                    scripts = collectedScripts
                        .map((script: any) => renderScriptElement(script))
                        .join('');
                }
        
                const head = unescapeHTML(styles + links + scripts);
        
                let headAndContent = createHeadAndContent(
                    head as any,
                    renderTemplate`${renderComponent(
                        result,
                        component.name,
                        component,
                        props,
                        childNodes
                    )}`
                );
        
                const propagators = result._metadata.propagators || result.propagators;
                propagators.add({
                    init() {
                        return headAndContent;
                    },
                });
        
                return headAndContent;
            },
            moduleId: component.name ?? 'isPropagatedAssetsModule',
            propagation: 'self'
        })

        return comp
    } else {
        if(typeof node.name === 'string') {
            const comp = await AcfComponents(node)
            return comp
        } else {
            const comp = createComponent({
                factory(result: any) {
                    return renderTemplate`${renderComponent(result, node.name, node.name, node.attributes, childNodes)}`
                },
                moduleId: node.name ?? 'isElement',
                propagation: 'self'
            })
            return comp
        }
    }
}

type PropagatedAssetsModule = {
	__astroPropagation: true;
	getMod: () => Promise<AstroInstance>;
	collectedStyles: string[];
	collectedLinks: string[];
	collectedScripts: string[];
};

export function isPropagatedAssetsModule(module: any): module is PropagatedAssetsModule {
	return typeof module === 'object' && module != null && '__astroPropagation' in module;
}

export function isFunction(value: any): value is Function {
    return typeof value === 'function'
}

export function isObject(value: any): value is Object {
    return typeof value === 'object'
}

export function isRenderableTreeNode(value: RenderableTreeNodes): value is RenderableTreeNode {
    return !Array.isArray(value)
}