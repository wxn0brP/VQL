import { VQL_Query_CRUD_Keys } from "#types/vql";
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
        [collection: string, search: any, options?: any, findOpts?: any, context?: any],
        any[]
    >;
    findOne?: ResolverFn<
        [collection: string, search: any, findOpts?: any, context?: any],
        any | null
    >;

    update?: ResolverFn<[collection: string, search: any, updater: any, context?: any], boolean>;
    updateOne?: ResolverFn<[collection: string, search: any, updater: any, context?: any], boolean>;
    updateOneOrAdd?: ResolverFn<[collection: string, search: any, updater: any, opts?: any], boolean>;
    toggleOne?: ResolverFn<[collection: string, search: any, data?: any, context?: any], boolean>,

    remove?: ResolverFn<[collection: string, search: any, context?: any], boolean>;
    removeOne?: ResolverFn<[collection: string, search: any, context?: any], boolean>;

    removeCollection?: ResolverFn<[collection: string], boolean>;
}

export type Operation = Exclude<VQL_Query_CRUD_Keys, "f">;
const list: Operation[] = [
    "ensureCollection", "issetCollection", "getCollections", "removeCollection",
    "add",
    "find", "findOne",
    "update", "updateOne",
    "updateOneOrAdd", "toggleOne",
    "remove", "removeOne"
];

export function createValtheraAdapter(resolver: ValtheraResolver, extendedFind: boolean = false): ValtheraCompatible {
    const safe = <T>(fn?: T): T => {
        if (!fn) throw new Error("Unimplemented method");
        return fn;
    };

    const adapter: ValtheraCompatible = {
        // @ts-ignore
        meta: resolver.meta ?? { type: "api", version: "0.0.1" },
    };

    adapter.c = (collection: string) => new CollectionManager(adapter, collection);

    for (const name of list) {
        adapter[name] = (...args: any[]) => safe(resolver[name])(...args);
    }

    if (extendedFind) {
        adapter.find = async (col, search, options, findOpts, context) => {
            let data = await safe(resolver.find)(col, search, options, findOpts, context);

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

export class AdapterBuilder {
    private handlers: Map<string, Function> = new Map();
    private collections: Set<string> = new Set();

    constructor(
        private catchCb: (e: any, op: string, args: any[]) => void = (e) => { console.log(e); }
    ) { }

    register(op: Operation, collection: string, fn: Function) {
        this.handlers.set(`${op}:${collection}`, fn);
        this.collections.add(collection);
        return this;
    }

    add(collection: string, fn: ValtheraResolver["add"]) {
        return this.register("add", collection, fn);
    }

    find(collection: string, fn: ValtheraResolver["find"]) {
        return this.register("find", collection, fn);
    }

    findOne(collection: string, fn: ValtheraResolver["findOne"]) {
        return this.register("findOne", collection, fn);
    }

    update(collection: string, fn: ValtheraResolver["update"]) {
        return this.register("update", collection, fn);
    }

    updateOne(collection: string, fn: ValtheraResolver["updateOne"]) {
        return this.register("updateOne", collection, fn);
    }

    updateOneOrAdd(collection: string, fn: ValtheraResolver["updateOneOrAdd"]) {
        return this.register("updateOneOrAdd", collection, fn);
    }

    toggleOne(collection: string, fn: ValtheraResolver["toggleOne"]) {
        return this.register("toggleOne", collection, fn);
    }

    remove(collection: string, fn: ValtheraResolver["remove"]) {
        return this.register("remove", collection, fn);
    }

    removeOne(collection: string, fn: ValtheraResolver["removeOne"]) {
        return this.register("removeOne", collection, fn);
    }

    removeCollection(collection: string, fn: ValtheraResolver["removeCollection"]) {
        return this.register("removeCollection", collection, fn);
    }

    getAdapter(extendedFind: boolean = true) {
        const resolve = async (op: string, ...args: any[]) => {
            const col: string = args.shift();
            const handler = this.handlers.get(`${op}:${col}`) || this.handlers.get(`${op}:*`) || null;
            if (!handler) throw new Error(`Unimplemented method: ${op}:${col}`);
            if (col === "*") args.unshift(col);
            try {
                return await handler(...args);
            } catch (e) {
                this.catchCb(e, op, args);
            }
        };

        const adapter = createValtheraAdapter({
            getCollections: async () => Array.from(this.collections),
            issetCollection: async (col) => this.collections.has(col),
            ensureCollection: async (col) => {
                if (!this.collections.has(col))
                    this.collections.add(col)
                return true;
            },
        }, extendedFind);

        for (const name of list.slice(4))
            adapter[name] = (...args: any[]) => resolve(name, ...args);

        return adapter;
    }
}