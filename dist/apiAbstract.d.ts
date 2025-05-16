import type { ValtheraCompatible } from "@wxn0brp/db";
type ResolverFn<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;
export interface ValtheraResolver {
    getCollections?: ResolverFn<[], string[]>;
    issetCollection?: ResolverFn<[string], boolean>;
    checkCollection?: ResolverFn<[string], boolean>;
    add?: ResolverFn<[string, any], any>;
    find?: ResolverFn<[string, any], any[]>;
    findOne?: ResolverFn<[string, any], any | null>;
    update?: ResolverFn<[string, any, any], boolean>;
    updateOne?: ResolverFn<[string, any, any], boolean>;
    remove?: ResolverFn<[string, any], boolean>;
    removeOne?: ResolverFn<[string, any], boolean>;
    removeCollection?: ResolverFn<[string], boolean>;
}
export declare function createValtheraAdapter(resolver: ValtheraResolver): ValtheraCompatible;
export {};
