import { VQL_Query_CRUD_Keys } from "../types/vql.js";
import { ValtheraCompatible } from "@wxn0brp/db-core";
import { AddQuery, FindOneQuery, FindQuery, RemoveQuery, ToggleOneQuery, ToggleOneResult, UpdateOneOrAddQuery, UpdateOneOrAddResult, UpdateQuery } from "@wxn0brp/db-core/types/query";
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
    toggleOne?: ResolverFn<ToggleOneQuery, ToggleOneResult<Object>>;
    remove?: ResolverFn<RemoveQuery, Object | null>;
    removeOne?: ResolverFn<RemoveQuery, Object | null>;
    removeCollection?: ResolverFn<string, boolean>;
}
export type Operation = Exclude<VQL_Query_CRUD_Keys, "f">;
export declare function createValtheraAdapter(resolver: ValtheraResolver, extendedFind?: boolean): ValtheraCompatible;
export declare class AdapterBuilder {
    private catchCb;
    private handlers;
    private collections;
    constructor(catchCb?: (e: any, op: string, arg: any) => void);
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
