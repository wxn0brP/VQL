import CollectionManager from "@wxn0brp/db-core/helpers/CollectionManager";
import updateFindObject from "@wxn0brp/db-core/utils/updateFindObject";
const list = [
    "ensureCollection", "issetCollection", "getCollections", "removeCollection",
    "add",
    "find", "findOne",
    "update", "updateOne",
    "updateOneOrAdd", "toggleOne",
    "remove", "removeOne"
];
export function createValtheraAdapter(resolver, extendedFind = false) {
    const safe = (fn) => {
        if (!fn)
            throw new Error("Unimplemented method");
        return fn;
    };
    const adapter = {
        // @ts-ignore
        meta: resolver.meta ?? { type: "api", version: "0.0.1" },
    };
    adapter.c = (collection) => new CollectionManager(adapter, collection);
    for (const name of list) {
        adapter[name] = (...args) => safe(resolver[name])(...args);
    }
    if (extendedFind) {
        adapter.find = async (col, search, options, findOpts, context) => {
            let data = await safe(resolver.find)(col, search, options, findOpts, context);
            if (options?.reverse)
                data.reverse();
            if (options?.limit !== -1 && data.length > options?.limit)
                data = data.slice(0, options?.limit);
            data = data.map(d => updateFindObject(d, findOpts || {}));
            return data;
        };
        adapter.findOne = async (col, search, context, findOpts) => {
            const data = await safe(resolver.findOne)(col, search, context, findOpts);
            if (typeof data !== "object")
                return data;
            return updateFindObject(data, findOpts || {});
        };
    }
    return adapter;
}
export class AdapterBuilder {
    catchCb;
    handlers = new Map();
    collections = new Set();
    constructor(catchCb = (e) => { console.log(e); }) {
        this.catchCb = catchCb;
    }
    register(op, collection, fn) {
        this.handlers.set(`${op}:${collection}`, fn);
        this.collections.add(collection);
        return this;
    }
    add(collection, fn) {
        return this.register("add", collection, fn);
    }
    find(collection, fn) {
        return this.register("find", collection, fn);
    }
    findOne(collection, fn) {
        return this.register("findOne", collection, fn);
    }
    update(collection, fn) {
        return this.register("update", collection, fn);
    }
    updateOne(collection, fn) {
        return this.register("updateOne", collection, fn);
    }
    updateOneOrAdd(collection, fn) {
        return this.register("updateOneOrAdd", collection, fn);
    }
    toggleOne(collection, fn) {
        return this.register("toggleOne", collection, fn);
    }
    remove(collection, fn) {
        return this.register("remove", collection, fn);
    }
    removeOne(collection, fn) {
        return this.register("removeOne", collection, fn);
    }
    removeCollection(collection, fn) {
        return this.register("removeCollection", collection, fn);
    }
    getAdapter(extendedFind = true) {
        const resolve = async (op, ...args) => {
            const col = args.shift();
            const handler = this.handlers.get(`${op}:${col}`) || this.handlers.get(`${op}:*`) || null;
            if (!handler)
                throw new Error(`Unimplemented method: ${op}:${col}`);
            if (col === "*")
                args.unshift(col);
            try {
                return await handler(...args);
            }
            catch (e) {
                this.catchCb(e, op, args);
            }
        };
        const adapter = createValtheraAdapter({
            getCollections: async () => Array.from(this.collections),
            issetCollection: async (col) => this.collections.has(col),
            ensureCollection: async (col) => {
                if (!this.collections.has(col))
                    this.collections.add(col);
                return true;
            },
        }, extendedFind);
        for (const name of list.slice(4))
            adapter[name] = (...args) => resolve(name, ...args);
        return adapter;
    }
}
