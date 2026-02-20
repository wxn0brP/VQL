import { RelationTypes } from "@wxn0brp/db";
import { Search, Arg } from "@wxn0brp/db-core/types/arg";
import { DbFindOpts, FindOpts } from "@wxn0brp/db-core/types/options";
import { UpdaterArg } from "@wxn0brp/db-core/types/updater";
export interface VQL_OP_Find<T = any> {
    collection: string;
    search?: Search<T>;
    limit?: number;
    fields?: VQL_Fields;
    select?: VQL_Fields;
    options?: DbFindOpts<T>;
    searchOpts?: FindOpts<T>;
}
export interface VQL_OP_FindOne<T = any> {
    collection: string;
    search: Search<T>;
    fields?: VQL_Fields;
    select?: VQL_Fields;
    searchOpts?: FindOpts<T>;
}
export interface VQL_OP_Add<T = any> {
    collection: string;
    data: Arg<T>;
    id_gen?: boolean;
}
export interface VQL_OP_Update<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
}
export interface VQL_OP_Remove<T = any> {
    collection: string;
    search: Search<T>;
}
export interface VQL_OP_UpdateOneOrAdd<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
    add_arg?: Arg<T>;
    id_gen?: boolean;
}
export interface VQL_OP_ToggleOne<T = any> {
    collection: string;
    search: Search<T>;
    data?: Arg<T>;
}
export interface VQL_OP_CollectionOperation {
    collection: string;
}
export type VQL_Fields = Record<string, boolean | number> | string[];
export type VQL_Query_CRUD_Data<T = any> = {
    find: VQL_OP_Find<T>;
} | {
    findOne: VQL_OP_FindOne<T>;
} | {
    f: VQL_OP_FindOne<T>;
} | {
    add: VQL_OP_Add<T>;
} | {
    update: VQL_OP_Update<T>;
} | {
    updateOne: VQL_OP_Update<T>;
} | {
    remove: VQL_OP_Remove<T>;
} | {
    removeOne: VQL_OP_Remove<T>;
} | {
    updateOneOrAdd: VQL_OP_UpdateOneOrAdd<T>;
} | {
    toggleOne: VQL_OP_ToggleOne<T>;
} | {
    removeCollection: VQL_OP_CollectionOperation;
} | {
    ensureCollection: VQL_OP_CollectionOperation;
} | {
    issetCollection: VQL_OP_CollectionOperation;
} | {
    getCollections: {};
};
export type VQL_Query_CRUD_Keys = VQL_Query_CRUD_Data extends infer U ? U extends Record<string, unknown> ? keyof U : never : never;
export interface VQL_Query_CRUD<T = any> {
    db: string;
    d: VQL_Query_CRUD_Data<T>;
}
export interface VQL_Query_Relation {
    r: {
        path: RelationTypes.Path;
        search: Search;
        relations: RelationTypes.Relation;
        many?: boolean;
        options?: DbFindOpts;
        select?: RelationTypes.FieldPath[] | Record<string, any>;
    };
}
export interface VQL_Var {
    var?: {
        [k: string]: any;
    };
}
/** VQL Query */
export type VQL_Query<T = any> = (VQL_Query_CRUD<T> | VQL_Query_Relation) & VQL_Var;
/** VQL Universal Query */
export type VQLUQ<T = any> = VQL_Query<T> | string | {
    query: string;
} & VQL_Var;
export interface VQLError {
    err: true;
    msg: string;
    c: number;
}
