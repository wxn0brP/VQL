import { VQL_Query_CRUD_Keys } from "../types/vql.js";
import { ValtheraCompatible } from "@wxn0brp/db-core";
import { AddQuery, FindOneQuery, FindQuery, RemoveQuery, ToggleOneQuery, ToggleOneResult, UpdateOneOrAddQuery, UpdateOneOrAddResult, UpdateQuery } from "@wxn0brp/db-core/types/query";
export type ResolverFn<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;
export type DropFirstFromTuple<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;
export type DropFirst<T> = T extends (...args: infer Args) => infer R ? (...args: DropFirstFromTuple<Args>) => R : never;
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
    add?: ResolverFn<[query: AddQuery], Object>;
    find?: ResolverFn<[query: FindQuery], Object[]>;
    findOne?: ResolverFn<[query: FindOneQuery], Object | null>;
    update?: ResolverFn<[query: UpdateQuery], Object[] | null>;
    updateOne?: ResolverFn<[query: UpdateQuery], Object | null>;
    updateOneOrAdd?: ResolverFn<[query: UpdateOneOrAddQuery], UpdateOneOrAddResult<Object>>;
    toggleOne?: ResolverFn<[query: ToggleOneQuery], ToggleOneResult<Object>>;
    remove?: ResolverFn<[query: RemoveQuery], Object | null>;
    removeOne?: ResolverFn<[query: RemoveQuery], Object | null>;
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
    add(collection: (string & {}), fn: DropFirst<ValtheraResolver["add"]>): this;
    add(collection: "*", fn: ValtheraResolver["add"]): this;
    find(collection: (string & {}), fn: DropFirst<ValtheraResolver["find"]>): this;
    find(collection: "*", fn: ValtheraResolver["find"]): this;
    findOne(collection: (string & {}), fn: DropFirst<ValtheraResolver["findOne"]>): this;
    findOne(collection: "*", fn: ValtheraResolver["findOne"]): this;
    update(collection: (string & {}), fn: DropFirst<ValtheraResolver["update"]>): this;
    update(collection: "*", fn: ValtheraResolver["update"]): this;
    updateOne(collection: (string & {}), fn: DropFirst<ValtheraResolver["updateOne"]>): this;
    updateOne(collection: "*", fn: ValtheraResolver["updateOne"]): this;
    updateOneOrAdd(collection: (string & {}), fn: DropFirst<ValtheraResolver["updateOneOrAdd"]>): this;
    updateOneOrAdd(collection: "*", fn: ValtheraResolver["updateOneOrAdd"]): this;
    toggleOne(collection: (string & {}), fn: DropFirst<ValtheraResolver["toggleOne"]>): this;
    toggleOne(collection: "*", fn: ValtheraResolver["toggleOne"]): this;
    remove(collection: (string & {}), fn: DropFirst<ValtheraResolver["remove"]>): this;
    remove(collection: "*", fn: ValtheraResolver["remove"]): this;
    removeOne(collection: (string & {}), fn: DropFirst<ValtheraResolver["removeOne"]>): this;
    removeOne(collection: "*", fn: ValtheraResolver["removeOne"]): this;
    removeCollection(collection: (string & {}), fn: DropFirst<ValtheraResolver["removeCollection"]>): this;
    removeCollection(collection: "*", fn: ValtheraResolver["removeCollection"]): this;
    getAdapter(extendedFind?: boolean): ValtheraCompatible;
}
