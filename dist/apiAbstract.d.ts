import type { ValtheraCompatible } from "@wxn0brp/db";
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
    find?: ResolverFn<[
        collection: string,
        search: any,
        context?: any,
        options?: any,
        findOpts?: any
    ], any[]>;
    findOne?: ResolverFn<[
        collection: string,
        search: any,
        context?: any,
        findOpts?: any
    ], any | null>;
    update?: ResolverFn<[collection: string, search: any, updater: any, context?: any], boolean>;
    updateOne?: ResolverFn<[collection: string, search: any, updater: any, context?: any], boolean>;
    updateOneOrAdd?: ResolverFn<[
        collection: string,
        search: any,
        updater: any,
        add_arg?: any,
        context?: any,
        id_gen?: boolean
    ], boolean>;
    remove?: ResolverFn<[collection: string, search: any, context?: any], boolean>;
    removeOne?: ResolverFn<[collection: string, search: any, context?: any], boolean>;
    removeCollection?: ResolverFn<[collection: string], boolean>;
}
export declare function createValtheraAdapter(resolver: ValtheraResolver): ValtheraCompatible;
export {};
