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
            // console.log('MdocRender: isArrayItem ->', `node: ${n?.tag ?? n?.toLocaleString()} \n parent: ${node.toString()}`)
            return c
        }))
        // console.log('MdocRender: isArray ->', node)
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
        // console.log("MdocRender isHTMLString", `HTMLString: ${new HTMLString(node)}`, `\ncomponent: ${comp}`)
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
        // console.log("MdocRender isString || isNumber", `\n\ntext:${node}`)
        return comp
    }

    if(node === null || typeof node !== 'object' || !Tag.isTag(node)) {
        const comp = createComponent({
            factory() {
                return render``
            }
        })
        // console.log('MdocRender: isNull | isNotObject | isNotTag -> ', node, `\ncomponent: ${comp}`)
        return comp
    }

    const childNodes = await Promise.all(node.children.map(child => MdocRender({ node: child })))
    // console.log('childNodes', childNodes)

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

        // console.log('MdocRender: isFunction without head -> ', node, `\ncomponent: ${comp}`)
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

        // console.log('MdocRender: isPropagatedAssetModule -> ', node, `\ncomponent: ${comp}`)
        return comp
    } else {
        if(typeof node.name === 'string') {
            const comp = await AcfComponents(node)
            // console.log('MdocRender: AcfComponent ->', node, `component: ${comp}`)
            return comp
        } else {
            const comp = createComponent({
                factory(result: any) {
                    return renderTemplate`${renderComponent(result, node.name, node.name, node.attributes, childNodes)}`
                },
                moduleId: node.name ?? 'isElement',
                propagation: 'self'
            })
            // console.log("MdocRender: isElement-> ", node, `\ncomponent: ${comp}`)
            return comp
        }
    }
}

// export async function MdocRender({ node } : { node : RenderableTreeNodes }): Promise<AstroComponentFactory> {
//     if (Array.isArray(node)) {
//         const comp = createComponent({
//             factory(result: any, props: any) {
//                 return renderTemplate`${renderComponent(result, 'div', 'div', props, Promise.resolve(MdocRender({node})).then(v => v))}`
//             }
//         })
//         console.log("MdocRender isArray->true : ", comp.prototype, "\n", comp.toString())
//         return comp
//     }

//     if(isHTMLString(node)) {
//         const comp = createComponent({
//             factory() {
//                 return render`${node as HTMLString}`
//             }
//         })
//         console.log("MdocRender isHTMLString: ", comp.prototype, "\n", comp.toString())
//         return comp
//     }
    
//     if (typeof node === 'string' || typeof node === 'number') {
//         const comp = createComponent({
//             factory(){
//                 return render`${escapeHtml(String(node))}`
//             }
//         });
//         console.log("MdocRender isString || isNumber: ", comp.prototype, "\n", comp.toString())
//         return comp
//     }

//     if (node === null || typeof node !== 'object' || !Tag.isTag(node)) {
//         const comp = createComponent({
//             factory() {
//                 return render`${node}`
//             }
//         })
//         console.log("MdocRender isNull || isNotObject || isNotTag : ", comp.prototype, "\n", comp.toString())
//         return comp
//     }

//     const childNodes = await Promise.all(node.children.map(async (child) => await MdocRender({ node: child })));
//     console.log("MdocRender childNodes", childNodes)
//     const nodeName = node.name
//     console.log("MdocRender nodeName: ", nodeName)
    
//     if(typeof nodeName === 'function') {
//         const comp = createComponent({
//             factory(result: any) {
//                 return renderTemplate`${renderComponent(result, (nodeName as Function).name ?? 'p', nodeName, attributes, childNodes)}`
//             }
//         })
//         console.log("MdocRender isFunction : ", comp.prototype, "\n", comp.toString())
//         return comp
//     }

//     if (isPropagatedAssetsModule(nodeName)) {
//         const { collectedStyles, collectedLinks, collectedScripts } = nodeName;
// 		const component = (await nodeName.getMod()).default;
// 		const props = node.attributes;

//         const comp = createComponent({
//             factory(result: any) {

//                 const slots = {
//                     default: () =>
//                         render`${node.children.map((child) =>
//                             renderComponent(result, 'MdocRender', MdocRender, { node: child })
//                         )}`,
//                 };

//                 let styles = '',
//                     links = '',
//                     scripts = '';

//                 if(Array.isArray(collectedStyles)) {
//                     styles = collectedStyles.map(style => renderUniqueStylesheet(result, {
//                         type: 'inline',
//                         content: style
//                     })).join('')
//                 }

//                 if(Array.isArray(collectedLinks)) {
//                     links = collectedLinks.map(link => renderUniqueStylesheet(result, {
//                         type: 'external',
//                         src: link[0] === '/' ? link : '/' + link,
//                     })).join('')
//                 }

//                 if (Array.isArray(collectedScripts)) {
//                     scripts = collectedScripts.map(script => renderScriptElement(script as any)).join('')
//                 }

//                 const head = unescapeHTML(styles + links + scripts);

//                 let headAndContent = createHeadAndContent(
//                     head as any,
//                     renderTemplate`${renderComponent(result, component.name, component, props, slots)}`
//                 )

//                 const propagators = result._metadata.propagators || result.propagators;
//                 propagators.set(
//                     {},
//                     {
//                         init() {
//                             return headAndContent;
//                         },
//                     }
//                 );

//                 return headAndContent;
//             }
//         })
//         console.log("MdocRender isPropagatedassetModule : ", comp.prototype, "\n", comp.toString())
//         return comp
//     }

//     const {
//         name,
//         attributes = {},
//         children = [],
//     } = node;

//     if(typeof name === 'string') {
//         const comp = createComponent({
//             factory(result: any) {
//                 return renderTemplate`${renderComponent(result, name, name, attributes, children)}`
//             }
//         })
//         console.log("MdocRender isStringButLast : ", comp.prototype, "\n", comp.toString())
//         return comp
//     } else {
//         const comp = AcfComponents(node)
//         console.log("MdocRender AcfComponents : ", comp.prototype, "\n", comp.toString())
//         return comp
//     }
// }

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