import type { RenderableTreeNodes } from "@markdoc/markdoc/src/types";
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
import { AcfComponents } from '../virtual/index'

export async function MdocRender({ node } : { node : RenderableTreeNodes }): Promise<AstroComponentFactory> {
    if (Array.isArray(node)) {
        return createComponent({
            factory(result: any, props: any) {
                return renderTemplate`${renderComponent(result, 'div', 'div', props, Promise.resolve(MdocRender({node})).then(v => v))}`
            }
        })
    }

    if(isHTMLString(node)) {
        return createComponent({
            factory() {
                return render`${node as HTMLString}`
            }
        })
    }
    
    if (typeof node === 'string' || typeof node === 'number') {
        return createComponent({
            factory(){
                return render`${escapeHtml(String(node))}`
            }
        });
    }

    if (node === null || typeof node !== 'object' || !Tag.isTag(node)) {
        return createComponent({
            factory() {
                return render`${node}`
            }
        })
    }

    const childNodes = await Promise.all(node.children.map(async (child) => await MdocRender({ node: child })));
    const nodeName = node.name
    
    if(typeof nodeName === 'function') {
        return createComponent({
            factory(result: any) {
                return renderTemplate`${renderComponent(result, (nodeName as Function).name ?? 'p', nodeName, attributes, childNodes)}`
            }
        })
    }

    if (isPropagatedAssetsModule(nodeName)) {
        const { collectedStyles, collectedLinks, collectedScripts } = nodeName;
		const component = (await nodeName.getMod()).default;
		const props = node.attributes;

        return createComponent({
            factory(result: any) {

                const slots = {
                    default: () =>
                        render`${node.children.map((child) =>
                            renderComponent(result, 'MdocRender', MdocRender, { node: child })
                        )}`,
                };

                let styles = '',
                    links = '',
                    scripts = '';

                if(Array.isArray(collectedStyles)) {
                    styles = collectedStyles.map(style => renderUniqueStylesheet(result, {
                        type: 'inline',
                        content: style
                    })).join('')
                }

                if(Array.isArray(collectedLinks)) {
                    links = collectedLinks.map(link => renderUniqueStylesheet(result, {
                        type: 'external',
                        src: link[0] === '/' ? link : '/' + link,
                    })).join('')
                }

                if (Array.isArray(collectedScripts)) {
                    scripts = collectedScripts.map(script => renderScriptElement(script as any)).join('')
                }

                const head = unescapeHTML(styles + links + scripts);

                let headAndContent = createHeadAndContent(
                    head as any,
                    renderTemplate`${renderComponent(result, component.name, component, props, slots)}`
                )

                const propagators = result._metadata.propagators || result.propagators;
                propagators.set(
                    {},
                    {
                        init() {
                            return headAndContent;
                        },
                    }
                );

                return headAndContent;
            }
        })
    }

    const {
        name,
        attributes = {},
        children = [],
    } = node;

    if(typeof name === 'string') {
        return createComponent({
            factory(result: any) {
                return renderTemplate`${renderComponent(result, name, name, attributes, children)}`
            }
        })
    } else {
        return AcfComponents(node)
    }
}

type PropagatedAssetsModule = {
	__astroPropagation: true;
	getMod: () => Promise<AstroInstance>;
	collectedStyles: string[];
	collectedLinks: string[];
	collectedScripts: string[];
};

function isPropagatedAssetsModule(module: any): module is PropagatedAssetsModule {
	return typeof module === 'object' && module != null && '__astroPropagation' in module;
}