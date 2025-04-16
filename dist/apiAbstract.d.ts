import { Valthera } from "@wxn0brp/db";
import dbActionC from "@wxn0brp/db/action.js";
export interface Cfg {
    collections?: string[];
    dbAction?: dbActionC;
}
export declare abstract class ValtheraAdapter extends Valthera {
    collections: string[];
    constructor(cfg?: Cfg);
    getCollections(): Promise<string[]>;
    issetCollection(collection: string): Promise<boolean>;
}
