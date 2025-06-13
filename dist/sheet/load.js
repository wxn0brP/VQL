import { existsSync, readdirSync, readFileSync } from "fs";
function loadSheet(map, file) {
    if (!existsSync(file)) {
        throw new Error(`Sheet ${file} not found`);
    }
    const sheet = JSON.parse(readFileSync(file, "utf-8"));
    for (const key in sheet) {
        map.set(key, sheet[key]);
    }
}
export function loadSheetsFromDir(dir) {
    const map = new Map();
    for (const file of readdirSync(dir)) {
        loadSheet(map, `${dir}/${file}`);
    }
    return map;
}
export function loadSheetFromFile(file) {
    const map = new Map();
    loadSheet(map, file);
    return map;
}
