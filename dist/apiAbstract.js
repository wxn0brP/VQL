import CollectionManager from "@wxn0brp/db/helpers/CollectionManager.js";
import updateFindObject from "@wxn0brp/db/utils/updateFindObject.js";
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
        checkCollection: (c) => safe(resolver.checkCollection)(c),
        add: (col, data, id_gen) => safe(resolver.add)(col, data, id_gen),
        find: (col, search, context, options, findOpts) => safe(resolver.find)(col, search, context, options, findOpts),
        findOne: (col, search, context, findOpts) => safe(resolver.findOne)(col, search, context, findOpts),
        update: (col, search, up) => safe(resolver.update)(col, search, up),
        updateOne: (col, search, up) => safe(resolver.updateOne)(col, search, up),
        updateOneOrAdd: (col, search, up, add_data, ctx, id_gen) => safe(resolver.updateOneOrAdd)(col, search, up, add_data, ctx, id_gen),
        remove: (col, search) => safe(resolver.remove)(col, search),
        removeOne: (col, search) => safe(resolver.removeOne)(col, search),
        removeCollection: (col) => safe(resolver.removeCollection)(col),
        findStream: null,
        transaction: null,
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
//# sourceMappingURL=apiAbstract.js.map