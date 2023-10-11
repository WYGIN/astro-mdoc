import type { AstroComponentFactory } from "astro/runtime/server/index.js"
import { isAstroComponentFactory } from "astro/runtime/server/render/astro/factory.js";
import { customAlphabet } from 'nanoid/non-secure';
import { toACF } from "./isAcf";
import type { AstroInstance } from "astro";

export const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ');
export const acfMap = new Map<string, AstroInstance['default']>();

export const ACFMap = {
    add: (component: (Element | Node | AstroComponentFactory), name?: string): AstroInstance['default'] => {
        if(isAstroComponentFactory(component)) {
            acfMap.has(component.name) && name ? (acfMap.has(name) ? ACFMap.add(component, getImportSafeName(4)) : acfMap.set(name, component)) : ACFMap.add(component, getImportSafeName(4))
        }
        const acf = toACF(component);
        acfMap.has(acf.name) ? ACFMap.add(component, getImportSafeName(4)) : acfMap.set(acf.name, acf)
        return acf;
    },
    get: () => acfMap
}

export const getImportSafeName = (size: number) => {
    return nanoid(size);
}