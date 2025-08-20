import CollectionManager from "@wxn0brp/db-core/helpers/CollectionManager";
import updateFindObject from "@wxn0brp/db-core/utils/updateFindObject";
export function createValtheraAdapter(resolver, extendedFind = false) {
    const safe = (fn) => {
        if (!fn)
            throw new Error("Unimplemented method");
        return fn;
    };
    const adapter = {
        // @ts-ignore
        meta: resolver.meta ?? { type: "api", version: "0.0.1" },
        c: null,
        getCollections: () => safe(resolver.getCollections)(),
        issetCollection: (c) => safe(resolver.issetCollection)(c),
        ensureCollection: (c) => safe(resolver.ensureCollection)(c),
        add: (col, data, id_gen) => safe(resolver.add)(col, data, id_gen),
        find: (col, search, context, options, findOpts) => safe(resolver.find)(col, search, context, options, findOpts),
        findOne: (col, search, context, findOpts) => safe(resolver.findOne)(col, search, context, findOpts),
        update: (col, search, up) => safe(resolver.update)(col, search, up),
        updateOne: (col, search, up) => safe(resolver.updateOne)(col, search, up),
        updateOneOrAdd: (col, search, up, add_data, ctx, id_gen) => safe(resolver.updateOneOrAdd)(col, search, up, add_data, ctx, id_gen),
        remove: (col, search) => safe(resolver.remove)(col, search),
        removeOne: (col, search) => safe(resolver.removeOne)(col, search),
        removeCollection: (col) => safe(resolver.removeCollection)(col),
    };
    adapter.c = (collection) => new CollectionManager(adapter, collection);
    if (extendedFind) {
        adapter.find = async (col, search, context, options, findOpts) => {
            let data = await safe(resolver.find)(col, search, context, options, findOpts);
            if (options?.reverse)
                data.reverse();
            if (options?.max !== -1 && data.length > options?.max)
                data = data.slice(0, options?.max);
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
    handlers = new Map();
    collections = new Set();
    register(op, collection, fn) {
        this.handlers.set(`${op}:${collection}`, fn);
        this.collections.add(collection);
        return this;
    }
    getAdapter(extendedFind = true) {
        const resolve = async (op, col, ...args) => {
            const handler = this.handlers.get(`${op}:${col}`) || this.handlers.get(`${op}:*`) || null;
            if (!handler)
                throw new Error(`Unimplemented method: ${op}:${col}`);
            return handler(...args);
        };
        const adapter = createValtheraAdapter({
            getCollections: async () => Array.from(this.collections),
            issetCollection: async (col) => this.collections.has(col),
            ensureCollection: async (col) => {
                if (!this.collections.has(col))
                    this.collections.add(col);
                return true;
            },
            add: (col, data, id_gen) => resolve("add", col, data, id_gen),
            find: (col, search, context, options, findOpts) => resolve("find", col, search, context, options, findOpts),
            findOne: (col, search, context, findOpts) => resolve("findOne", col, search, context, findOpts),
            update: (col, search, up) => resolve("update", col, search, up),
            updateOne: (col, search, up) => resolve("updateOne", col, search, up),
            updateOneOrAdd: (col, search, up, add_data, ctx, id_gen) => resolve("updateOneOrAdd", col, search, up, add_data, ctx, id_gen),
            remove: (col, search) => resolve("remove", col, search),
            removeOne: (col, search) => resolve("removeOne", col, search),
            removeCollection: (col) => resolve("removeCollection", col),
        }, extendedFind);
        return adapter;
    }
}
