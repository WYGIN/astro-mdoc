import * as fs from 'node:fs';

export const markdocFileRegex = /\.(md|mdoc|js|ts|jsx|tsx|mjs|mts|ejs|ets)$/;
export const getFilesWithExtentions = (dir: URL, extentions: RegExp) => {
    let markdocFiles: Array<URL> = [];
    if(fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for(const file of files) {
            const filepath = new URL(file, dir);
            if(fs.statSync(filepath).isDirectory()) {
                getFilesWithExtentions(filepath, extentions);
            } else {
                if(extentions.test(filepath.href)) {
                    markdocFiles.push(filepath);
                }
            }
        }
    }
    return markdocFiles;
}