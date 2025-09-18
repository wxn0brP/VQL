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

const list = [
    "ensureCollection", "issetCollection", "getCollections", "removeCollection",
    "add",
    "find", "findOne",
    "update", "updateOne", "updateOneOrAdd",
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

export type Operation = "add" | "find" | "findOne" | "update" | "updateOne" | "updateOneOrAdd" | "remove" | "removeOne" | "removeCollection";

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

    add(collection: string, fn: ResolverFn<[data: any, id_gen?: boolean], any>) {
        return this.register("add", collection, fn);
    }

    find(collection: string, fn: ResolverFn<[search: any, context?: any, options?: any, findOpts?: any], any[]>) {
        return this.register("find", collection, fn);
    }

    findOne(collection: string, fn: ResolverFn<[search: any, context?: any, findOpts?: any], any | null>) {
        return this.register("findOne", collection, fn);
    }

    update(collection: string, fn: ResolverFn<[collection: string, search: any, updater: any], boolean>) {
        return this.register("update", collection, fn);
    }

    updateOne(collection: string, fn: ResolverFn<[search: any, updater: any], boolean>) {
        return this.register("updateOne", collection, fn);
    }

    updateOneOrAdd(collection: string, fn: ResolverFn<[search: any, updater: any, add_arg?: any, context?: any, id_gen?: boolean], boolean>) {
        return this.register("updateOneOrAdd", collection, fn);
    }

    remove(collection: string, fn: ResolverFn<[search: any], boolean>) {
        return this.register("remove", collection, fn);
    }

    removeOne(collection: string, fn: ResolverFn<[search: any], boolean>) {
        return this.register("removeOne", collection, fn);
    }

    removeCollection(collection: string, fn: ResolverFn<[], boolean>) {
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

        for (const name of ["add", "find", "findOne", "update", "updateOne", "updateOneOrAdd", "remove", "removeOne", "removeCollection"]) {
            adapter[name] = (...args: any[]) => resolve(name, ...args);
        }

        return adapter;
    }
}