import { createComponent, renderComponent, renderTemplate } from "astro/runtime/server/index.js";
import { isAstroComponentFactory, type AstroComponentFactory } from "astro/runtime/server/render/astro/factory.js";
import { getImportSafeName } from "./acfMap";

export const toACF = (component: string | object | Node | Element | AstroComponentFactory, rename?: boolean): AstroComponentFactory => {
    if(!isAstroComponentFactory(component) || rename) {
        component = acf(component);
    }
    return component as AstroComponentFactory;
}

export const acf = (component: string | object | Node | Element | AstroComponentFactory): AstroComponentFactory => {
    return createComponent({
        factory(result: any, props: any, slots: any) {
            return renderTemplate`${renderComponent(result, getImportSafeName(4), component, props, slots)}`
        }
    })
}