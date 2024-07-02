import { createComponent, renderComponent, renderTemplate } from "astro/runtime/server/index.js";
import { isAstroComponentFactory, type AstroComponentFactory } from "astro/runtime/server/render/astro/factory.js";
import { getImportSafeName } from "./acf-map";

export const toACF = (component: unknown): AstroComponentFactory => {
    if(!isAstroComponentFactory(component)) {
        return acf(component);
    }

    return component;
}

export const acf = (component: unknown): AstroComponentFactory => {
    return createComponent({
        factory(result: any, props: any, slots: any) {
            return renderTemplate`${renderComponent(result, 'name', component, props, slots)}`
        },
        moduleId: getImportSafeName(4),
    });
}
