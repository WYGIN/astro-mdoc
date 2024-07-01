export interface MarkdocUserConfig {
    allowHTML?: boolean;
    markdocPath?: MarkdocPath;
}

export type FSPath = `/${string}`;

const __MarkdocPathSymbol = Symbol.for('@wygininc/types:MarkdocPath');

export type MarkdocPath = MarkdocPathObj | FSPath;

export type MarkdocPathObj = {
    readonly [__MarkdocPathSymbol]: true,
    base?: FSPath,
    nodes?: FSPath,
    tags?: FSPath,
    variables?: FSPath,
    functions?: FSPath,
    partials?: FSPath,
}

export const getMarkdocPath = (path?: MarkdocPath): MarkdocPathObj => {
    let mdocPath: MarkdocPathObj = {
        [__MarkdocPathSymbol]: true,
    };
    if(path && isMarkdocPathObj(path)) {
        if(path.base) {
            return {
                ...mdocPath,
                nodes: `${path.base}${path.nodes}index.ts`,
                tags: `${path.base}${path.tags}index.ts`,
                variables: `${path.base}${path.variables}index.ts`, 
                functions: `${path.base}${path.functions}index.ts`, 
                partials: `${path.base}${path.partials}`,
            }
        }
        return { 
            ...mdocPath,
            nodes: `/src/markdoc${path.nodes ?? 'nodes'}index.ts`, 
            tags: `/src/markdoc${path.tags ?? 'tags'}index.ts`, 
            variables: `/src/markdoc${path.variables ?? 'variables'}index.ts`, 
            functions: `/src/markdoc${path.functions ?? 'functions'}index.ts`, 
            partials: `/src/markdoc${path.partials ?? 'partials'}`,
        }
    } else if(path && !isMarkdocPathObj(path))
        return { 
            ...mdocPath,
            nodes: `${path}nodes/index.ts` , 
            tags: `${path}tags/index.ts`, 
            variables: `${path}variables/index.ts`, 
            functions: `${path}functions/index.ts`, 
            partials: `${path}partials/`,
        }

    return {
        ...mdocPath, 
        nodes: `/src/markdoc/nodes/index.ts`, 
        tags: `/src/markdoc/tags/index.ts`, 
        variables: `/src/markdoc/variables/index.ts`, 
        functions: `/src/markdoc/functions/index.ts`, 
        partials: `/src/markdoc/partials/`,
    }
}

export const isMarkdocPathObj = (path: any): path is MarkdocPathObj => {
    return path === 'object' && 
        path !== null && 
        __MarkdocPathSymbol in path && 
        !!(path.__MarkdocPathSymbol) && 
        path.__MarkdocPathSymbol === true
}
