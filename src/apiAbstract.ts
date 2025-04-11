import { Valthera } from "@wxn0brp/db";
import dbActionC from "@wxn0brp/db/action.js";
import { MemoryAction } from "@wxn0brp/db/memory.js";

export interface Cfg {
    collections?: string[];
    dbAction?: dbActionC;
}

export abstract class ValtheraAdapter extends Valthera {
    public collections: string[];

    constructor (cfg?: Cfg) {
        super("", {
            dbAction: cfg?.dbAction || new MemoryAction()
        });
        this.collections = cfg?.collections ?? [];
    }

    async getCollections(): Promise<string[]> {
        return this.collections;
    }

    async issetCollection(collection: string): Promise<boolean> {
        return this.collections.includes(collection);
    }
}
