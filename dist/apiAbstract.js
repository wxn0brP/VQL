import { Valthera } from "@wxn0brp/db";
import { MemoryAction } from "@wxn0brp/db/memory.js";
export class ValtheraAdapter extends Valthera {
    collections;
    constructor(cfg) {
        super("", {
            dbAction: cfg?.dbAction || new MemoryAction()
        });
        this.collections = cfg?.collections ?? [];
    }
    async getCollections() {
        return this.collections;
    }
    async issetCollection(collection) {
        return this.collections.includes(collection);
    }
}
//# sourceMappingURL=apiAbstract.js.map