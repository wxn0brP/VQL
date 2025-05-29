import type { ValtheraCompatible } from "@wxn0brp/db";
import CollectionManager from "@wxn0brp/db/helpers/CollectionManager.js";

type ResolverFn<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;

export interface ValtheraResolverMeta {
    type: "valthera" | "api" | "wrapper" | (string & {});
    version: string;
    description?: string;
    id?: string;
    displayName?: string;
    tags?: string[];

    [key: string]: any;
}

export interface ValtheraResolver {
    meta?: ValtheraResolverMeta;

    getCollections?: ResolverFn<[], string[]>;
    issetCollection?: ResolverFn<[collection: string], boolean>;
    checkCollection?: ResolverFn<[collection: string], boolean>;

    add?: ResolverFn<[collection: string, data: any, id_gen?: boolean], any>;
    find?: ResolverFn<
        [collection: string, search: any, context?: any, options?: any, findOpts?: any],
        any[]
    >;
    findOne?: ResolverFn<
        [collection: string, search: any, context?: any, findOpts?: any],
        any | null
    >;

    update?: ResolverFn<[collection: string, search: any, updater: any, context?: any], boolean>;
    updateOne?: ResolverFn<[collection: string, search: any, updater: any, context?: any], boolean>;
    updateOneOrAdd?: ResolverFn<
        [collection: string, search: any, updater: any, add_arg?: any, context?: any, id_gen?: boolean],
        boolean
    >;

    remove?: ResolverFn<[collection: string, search: any, context?: any], boolean>;
    removeOne?: ResolverFn<[collection: string, search: any, context?: any], boolean>;

    removeCollection?: ResolverFn<[collection: string], boolean>;
}


export function createValtheraAdapter(resolver: ValtheraResolver): ValtheraCompatible {
    const safe = <T>(fn?: T): T => {
        if (!fn) throw new Error("Unimplemented method");
        return fn;
    };

    const adapter: ValtheraCompatible = {
        // @ts-ignore
        meta: resolver.meta ?? { type: "api", version: "0.0.1" },
        c: null,
        getCollections: () => safe(resolver.getCollections!)(),
        issetCollection: (c) => safe(resolver.issetCollection!)(c),
        checkCollection: (c) => safe(resolver.checkCollection!)(c),

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
    adapter.c = (collection: string) => new CollectionManager(adapter, collection);

    return adapter;
}
