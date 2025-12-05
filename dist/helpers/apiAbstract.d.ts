import { VQL_Query_CRUD_Keys } from "../types/vql.js";
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
        options?: any,
        findOpts?: any,
        context?: any
    ], any[]>;
    findOne?: ResolverFn<[
        collection: string,
        search: any,
        findOpts?: any,
        context?: any
    ], any | null>;
    update?: ResolverFn<[collection: string, search: any, updater: any, context?: any], boolean>;
    updateOne?: ResolverFn<[collection: string, search: any, updater: any, context?: any], boolean>;
    updateOneOrAdd?: ResolverFn<[collection: string, search: any, updater: any, opts?: any], boolean>;
    toggleOne?: ResolverFn<[collection: string, search: any, data?: any, context?: any], boolean>;
    remove?: ResolverFn<[collection: string, search: any, context?: any], boolean>;
    removeOne?: ResolverFn<[collection: string, search: any, context?: any], boolean>;
    removeCollection?: ResolverFn<[collection: string], boolean>;
}
export type Operation = Exclude<VQL_Query_CRUD_Keys, "f">;
export declare function createValtheraAdapter(resolver: ValtheraResolver, extendedFind?: boolean): ValtheraCompatible;
export declare class AdapterBuilder {
    private catchCb;
    private handlers;
    private collections;
    constructor(catchCb?: (e: any, op: string, args: any[]) => void);
    register(op: Operation, collection: string, fn: Function): this;
    add(collection: string, fn: ValtheraResolver["add"]): this;
    find(collection: string, fn: ValtheraResolver["find"]): this;
    findOne(collection: string, fn: ValtheraResolver["findOne"]): this;
    update(collection: string, fn: ValtheraResolver["update"]): this;
    updateOne(collection: string, fn: ValtheraResolver["updateOne"]): this;
    updateOneOrAdd(collection: string, fn: ValtheraResolver["updateOneOrAdd"]): this;
    toggleOne(collection: string, fn: ValtheraResolver["toggleOne"]): this;
    remove(collection: string, fn: ValtheraResolver["remove"]): this;
    removeOne(collection: string, fn: ValtheraResolver["removeOne"]): this;
    removeCollection(collection: string, fn: ValtheraResolver["removeCollection"]): this;
    getAdapter(extendedFind?: boolean): ValtheraCompatible;
}
export {};
