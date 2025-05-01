import type { ValtheraCompatible } from "@wxn0brp/db";

type ResolverFn<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;

export interface ValtheraResolver {
    getCollections?: ResolverFn<[], string[]>;
    issetCollection?: ResolverFn<[string], boolean>;
    checkCollection?: ResolverFn<[string], boolean>;

    add?: ResolverFn<[string, any], any>;
    find?: ResolverFn<[string, any], any[]>;
    findOne?: ResolverFn<[string, any], any | null>;

    update?: ResolverFn<[string, any, any], boolean>;
    updateOne?: ResolverFn<[string, any, any], boolean>;

    remove?: ResolverFn<[string, any], boolean>;
    removeOne?: ResolverFn<[string, any], boolean>;

    removeCollection?: ResolverFn<[string], boolean>;
}

export function createValtheraAdapter(resolver: ValtheraResolver): ValtheraCompatible {
    const safe = <T>(fn?: T): T => {
        if (!fn) throw new Error("Unimplemented method");
        return fn;
    };

    return {
        getCollections: () => safe(resolver.getCollections!)(),
        issetCollection: (c) => safe(resolver.issetCollection!)(c),
        checkCollection: (c) => safe(resolver.checkCollection!)(c),

        add: (col, data) => safe(resolver.add!)(col, data),
        find: (col, search) => safe(resolver.find!)(col, search),
        findOne: (col, search) => safe(resolver.findOne!)(col, search),

        update: (col, search, up) => safe(resolver.update!)(col, search, up),
        updateOne: (col, search, up) => safe(resolver.updateOne!)(col, search, up),

        remove: (col, search) => safe(resolver.remove!)(col, search),
        removeOne: (col, search) => safe(resolver.removeOne!)(col, search),

        removeCollection: (col) => safe(resolver.removeCollection!)(col),

        c: null,
        findStream: null,
        transaction: null,
        updateOneOrAdd: null
    };
}
