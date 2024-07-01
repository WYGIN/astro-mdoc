import type { AstroConfig } from "astro";
import * as fs from 'node:fs';
import { getFilesWithExtentions, markdocFileRegex } from "./helpers";
import { parse } from "@markdoc/markdoc";
import { getNamedImport } from "./named-imports";
import { ACFMap } from "../acf/acf-map";

export const getNodes = async (nodeUrl: URL, root: AstroConfig['root'], isNode: boolean) => {
    let node = {};
    const path = nodeUrl.pathname;
    if(!path || path === "" || path == null || !fs.existsSync(nodeUrl)) return node
    if(fs.existsSync(nodeUrl) && fs.lstatSync(nodeUrl).isDirectory()) {
        const partials = getFilesWithExtentions(nodeUrl, markdocFileRegex)
        await Promise.all(partials.map(async partial => {
            const partialFileName = partial.pathname.split("/")
            const data = await fs.promises.readFile(partial.href.split(root.href)[1], 'utf8')
            Object.assign(node, { [partialFileName[partialFileName.length - 1]]: parse(data)})
        }))
    } else {
        const obj = await import(path);
        const namedImports = getNamedImport(obj);
        for(const namedImport of namedImports) {
            if(isNode) {
                const o = obj[namedImport]
                ACFMap.add(path, namedImport);
                Object.assign(node, { [namedImport] : { ...o, render: namedImport } });
            } else{
                Object.assign(node, { [namedImport]: obj[namedImport] });
            }
        }
    }
    return node;
}