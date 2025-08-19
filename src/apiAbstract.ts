import { ValtheraCompatible } from "@wxn0brp/db-core";
import CollectionManager from "@wxn0brp/db-core/helpers/CollectionManager";
import updateFindObject from "@wxn0brp/db-core/utils/updateFindObject";

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
    ensureCollection?: ResolverFn<[collection: string], boolean>;

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

export function createValtheraAdapter(resolver: ValtheraResolver, extendedFind: boolean = false): ValtheraCompatible {
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
        ensureCollection: (c) => safe(resolver.ensureCollection!)(c),

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
    adapter.c = (collection: string) => new CollectionManager(adapter, collection);

    if (extendedFind) {
        adapter.find = async (col, search, context, options, findOpts) => {
            let data = await safe(resolver.find)(col, search, context, options, findOpts);

            if (options?.reverse) data.reverse();

            if (options?.max !== -1 && data.length > options?.max)
                data = data.slice(0, options?.max);

            data = data.map(d => updateFindObject(d, findOpts || {}));

            return data;
        };

        adapter.findOne = async (col, search, context, findOpts) => {
            const data = await safe(resolver.findOne)(col, search, context, findOpts);
            if (typeof data !== "object") return data;
            return updateFindObject(data, findOpts || {}) as any;
        };
    }

    return adapter;
}

export type Operation = "add" | "find" | "findOne" | "update" | "updateOne" | "updateOneOrAdd" | "remove" | "removeOne" | "removeCollection";

export class AdapterBuilder {
    private handlers: Map<string, Function> = new Map();
    private collections: Set<string> = new Set();

    register(op: "add", collection: string, fn: ResolverFn<[collection: string, data: any, id_gen?: boolean], any>);
    register(op: "find", collection: string, fn: ResolverFn<[collection: string, search: any, context?: any, options?: any, findOpts?: any], any[]>);
    register(op: "findOne", collection: string, fn: ResolverFn<[collection: string, search: any, context?: any, findOpts?: any], any | null>);
    register(op: "update", collection: string, fn: ResolverFn<[collection: string, search: any, updater: any], boolean>);
    register(op: "updateOne", collection: string, fn: ResolverFn<[collection: string, search: any, updater: any], boolean>);
    register(op: "updateOneOrAdd", collection: string, fn: ResolverFn<[collection: string, search: any, updater: any, add_arg?: any, context?: any, id_gen?: boolean], boolean>);
    register(op: "remove", collection: string, fn: ResolverFn<[collection: string, search: any], boolean>);
    register(op: "removeOne", collection: string, fn: ResolverFn<[collection: string, search: any], boolean>);
    register(op: "removeCollection", collection: string, fn: ResolverFn<[collection: string], boolean>);
    register(op: Operation, collection: string, fn: Function) {
        this.handlers.set(`${op}:${collection}`, fn);
        this.collections.add(collection);
        return this;
    }

    getAdapter(extendedFind: boolean = true) {
        const resolve = async (op: string, col: string, ...args: any[]) => {
            const handler = this.handlers.get(`${op}:${col}`) || this.handlers.get(`${op}:*`) || null;
            if (!handler) throw new Error(`Unimplemented method: ${op}:${col}`);
            return handler(...args);
        };

        const adapter = createValtheraAdapter({
            getCollections: async () => Array.from(this.collections),
            issetCollection: async (col) => this.collections.has(col),
            ensureCollection: async (col) => {
                if (!this.collections.has(col))
                    this.collections.add(col)
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