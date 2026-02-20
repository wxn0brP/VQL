import { VQL_Query_CRUD_Keys } from "#types/vql";
import { ValtheraCompatible } from "@wxn0brp/db-core";
import { Collection } from "@wxn0brp/db-core/helpers/collection";
import { Data } from "@wxn0brp/db-core/types/data";
import {
    AddQuery,
    FindOneQuery,
    FindQuery,
    RemoveQuery,
    ToggleOneQuery,
    ToggleOneResult,
    UpdateOneOrAddQuery,
    UpdateOneOrAddResult,
    UpdateQuery
} from "@wxn0brp/db-core/types/query";
import { updateFindObject } from "@wxn0brp/db-core/utils/updateFindObject";

export type ResolverFn<TArg = any, TReturn = any> = (query: TArg) => Promise<TReturn>;

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

    getCollections?: ResolverFn<void, string[]>;
    issetCollection?: ResolverFn<string, boolean>;
    ensureCollection?: ResolverFn<string, boolean>;

    add?: ResolverFn<AddQuery, Object>;
    find?: ResolverFn<FindQuery, Object[]>;
    findOne?: ResolverFn<FindOneQuery, Object | null>;

    update?: ResolverFn<UpdateQuery, Object[] | null>;
    updateOne?: ResolverFn<UpdateQuery, Object | null>;
    updateOneOrAdd?: ResolverFn<UpdateOneOrAddQuery, UpdateOneOrAddResult<Object>>;
    toggleOne?: ResolverFn<ToggleOneQuery, ToggleOneResult<Object>>,

    remove?: ResolverFn<RemoveQuery, Object | null>;
    removeOne?: ResolverFn<RemoveQuery, Object | null>;

    removeCollection?: ResolverFn<string, boolean>;
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
        // @ts-expect-error
        meta: resolver.meta ?? { type: "api", version: "0.0.1" },
    };

    adapter.c = (collection: string) => new Collection(adapter, collection);

    for (const name of list) {
        // @ts-expect-error
        adapter[name] = (query: any) => safe(resolver[name])(query);
    }

    if (extendedFind) {
        adapter.find = async <T = Data>(query: FindQuery) => {
            let data = await safe(resolver.find)(query);
            const { dbFindOpts: options, findOpts } = query;

            if (options?.reverse) data.reverse();

            if (options?.limit !== -1 && data.length > options?.limit)
                data = data.slice(0, options?.limit);

            data = data.map(d => updateFindObject(d, findOpts || {}));

            return data as T[];
        };

        adapter.findOne = async <T = Data>(query: FindOneQuery) => {
            const data = await safe(resolver.findOne)(query);
            if (typeof data !== "object") return data;
            return updateFindObject(data, query.findOpts || {}) as T;
        };
    }

    return adapter;
}

export class AdapterBuilder {
    private handlers: Map<string, Function> = new Map();
    private collections: Set<string> = new Set();

    constructor(
        private catchCb: (e: any, op: string, arg: any) => void = (e) => { console.log(e); }
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
        const resolve = async (op: string, arg: any) => {
            const col: string =
                typeof arg === "object" && "collection" in arg ?
                    arg.collection :
                    arg;

            const handler = this.handlers.get(`${op}:${col}`) || this.handlers.get(`${op}:*`) || null;
            if (!handler) throw new Error(`Unimplemented method: ${op}:${col}`);
            try {
                return await handler(arg);
            } catch (e) {
                this.catchCb(e, op, arg);
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
            // @ts-expect-error
            adapter[name] = (arg: any) => resolve(name, arg);

        return adapter;
    }
}
