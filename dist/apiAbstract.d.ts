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
    private catchCb;
    private handlers;
    private collections;
    constructor(catchCb?: (e: any, op: string, args: any[]) => void);
    register(op: Operation, collection: string, fn: Function): this;
    add(collection: string, fn: ResolverFn<[data: any, id_gen?: boolean], any>): this;
    find(collection: string, fn: ResolverFn<[search: any, context?: any, options?: any, findOpts?: any], any[]>): this;
    findOne(collection: string, fn: ResolverFn<[search: any, context?: any, findOpts?: any], any | null>): this;
    update(collection: string, fn: ResolverFn<[collection: string, search: any, updater: any], boolean>): this;
    updateOne(collection: string, fn: ResolverFn<[search: any, updater: any], boolean>): this;
    updateOneOrAdd(collection: string, fn: ResolverFn<[search: any, updater: any, add_arg?: any, context?: any, id_gen?: boolean], boolean>): this;
    remove(collection: string, fn: ResolverFn<[search: any], boolean>): this;
    removeOne(collection: string, fn: ResolverFn<[search: any], boolean>): this;
    removeCollection(collection: string, fn: ResolverFn<[], boolean>): this;
    getAdapter(extendedFind?: boolean): ValtheraCompatible;
}
export {};
