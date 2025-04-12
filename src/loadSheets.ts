import { existsSync, readdirSync, readFileSync } from "fs";
import { VQL } from "./types/vql";

function loadSheet(map: Map<string, VQL>, file: string) {
    if (!existsSync(file)) {
        throw new Error(`Sheet ${file} not found`);
    }

    const sheet = JSON.parse(readFileSync(file, "utf-8")) as Record<string, VQL>;

    for (const key in sheet) {
        map.set(key, sheet[key]);
    }
}

export function loadSheetsFromDir(dir: string) {
    const map = new Map<string, VQL>();

    for (const file of readdirSync(dir)) {
        loadSheet(map, `${dir}/${file}`);
    }

    return map;
}

export function loadSheetFromFile(file: string) {
    const map = new Map<string, VQL>();
    loadSheet(map, file);
    return map;
}