import { ValtheraCompatible } from "@wxn0brp/db-core";
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
export declare function createValtheraAdapter(resolver: ValtheraResolver, extendedFind?: boolean): ValtheraCompatible;
export type Operation = "add" | "find" | "findOne" | "update" | "updateOne" | "updateOneOrAdd" | "remove" | "removeOne" | "removeCollection";
export declare class AdapterBuilder {
    private handlers;
    private collections;
    register(op: "add", collection: string, fn: ResolverFn<[collection: string, data: any, id_gen?: boolean], any>): any;
    register(op: "find", collection: string, fn: ResolverFn<[collection: string, search: any, context?: any, options?: any, findOpts?: any], any[]>): any;
    register(op: "findOne", collection: string, fn: ResolverFn<[collection: string, search: any, context?: any, findOpts?: any], any | null>): any;
    register(op: "update", collection: string, fn: ResolverFn<[collection: string, search: any, updater: any], boolean>): any;
    register(op: "updateOne", collection: string, fn: ResolverFn<[collection: string, search: any, updater: any], boolean>): any;
    register(op: "updateOneOrAdd", collection: string, fn: ResolverFn<[collection: string, search: any, updater: any, add_arg?: any, context?: any, id_gen?: boolean], boolean>): any;
    register(op: "remove", collection: string, fn: ResolverFn<[collection: string, search: any], boolean>): any;
    register(op: "removeOne", collection: string, fn: ResolverFn<[collection: string, search: any], boolean>): any;
    register(op: "removeCollection", collection: string, fn: ResolverFn<[collection: string], boolean>): any;
    getAdapter(extendedFind?: boolean): ValtheraCompatible;
}
export {};
