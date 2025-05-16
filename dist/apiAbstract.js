export function createValtheraAdapter(resolver) {
    const safe = (fn) => {
        if (!fn)
            throw new Error("Unimplemented method");
        return fn;
    };
    return {
        getCollections: () => safe(resolver.getCollections)(),
        issetCollection: (c) => safe(resolver.issetCollection)(c),
        checkCollection: (c) => safe(resolver.checkCollection)(c),
        add: (col, data) => safe(resolver.add)(col, data),
        find: (col, search) => safe(resolver.find)(col, search),
        findOne: (col, search) => safe(resolver.findOne)(col, search),
        update: (col, search, up) => safe(resolver.update)(col, search, up),
        updateOne: (col, search, up) => safe(resolver.updateOne)(col, search, up),
        remove: (col, search) => safe(resolver.remove)(col, search),
        removeOne: (col, search) => safe(resolver.removeOne)(col, search),
        removeCollection: (col) => safe(resolver.removeCollection)(col),
        c: null,
        findStream: null,
        transaction: null,
        updateOneOrAdd: null
    };
}
//# sourceMappingURL=apiAbstract.js.map