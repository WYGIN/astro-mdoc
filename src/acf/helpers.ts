import { createComponent, renderComponent, renderTemplate } from "astro/dist/runtime/server"; 
import { isAstroComponentFactory, type AstroComponentFactory } from "astro/dist/runtime/server/render/astro/factory.js";
import { getImportSafeName } from "./acf-map";

export const toACF = (component: unknown): AstroComponentFactory => {
    if(!isAstroComponentFactory(component)) {
        let acfComp = acf(component);
        return acfComp
    } else {
        return component;
    }
}

export const acf = (component: unknown): AstroComponentFactory => {
    const name = getImportSafeName(4)
    const c = createComponent({
        factory(result: any, props: any, slots: any) {
            return renderTemplate`${renderComponent(result, 'name', component, props, slots)}`
        },
        moduleId: name
    })
    return c;
}
