import CollectionManager from "@wxn0brp/db/helpers/CollectionManager.js";
export function createValtheraAdapter(resolver) {
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
    return adapter;
}
//# sourceMappingURL=apiAbstract.js.map