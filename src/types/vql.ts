import { RelationTypes } from "@wxn0brp/db";
import { Search, Arg } from "@wxn0brp/db-core/types/arg";
import { DbFindOpts, FindOpts } from "@wxn0brp/db-core/types/options";
import { UpdaterArg } from "@wxn0brp/db-core/types/updater";

export type VQLQuery = {
    find: VQLFind,
    findOne: VQLFindOne,
    f: VQLFindOne,
    add: VQLAdd,
    update: VQLUpdate,
    updateOne: VQLUpdateOne,
    remove: VQLRemove,
    removeOne: VQLRemoveOne,
    updateOneOrAdd: VQLUpdateOneOrAdd,
    removeCollection: VQLCollectionOperation,
    checkCollection: VQLCollectionOperation,
    issetCollection: VQLCollectionOperation,
    getCollections: {}
}

export type VQLQueryData =
    | { find: VQLFind }
    | { findOne: VQLFindOne }
    | { f: VQLFindOne }
    | { add: VQLAdd }
    | { update: VQLUpdate }
    | { updateOne: VQLUpdateOne }
    | { remove: VQLRemove }
    | { removeOne: VQLRemoveOne }
    | { updateOneOrAdd: VQLUpdateOneOrAdd }
    | { removeCollection: VQLCollectionOperation }
    | { checkCollection: VQLCollectionOperation }
    | { issetCollection: VQLCollectionOperation }
    | { getCollections: {} }

export interface VQLRequest {
    db: string;
    d: VQLQueryData;
}

export interface VQLFind {
    collection: string;
    search?: Search;
    limit?: number;
    fields?: VQLFields;
    select?: VQLFields;
    relations?: VQLRelations;
    options?: DbFindOpts;
    searchOpts?: FindOpts;
}

export interface VQLFindOne {
    collection: string;
    search: Search;
    fields?: VQLFields;
    select?: VQLFields;
    relations?: VQLRelations;
    searchOpts?: FindOpts;
}

export interface VQLAdd {
    collection: string;
    data: Arg;
    id_gen?: boolean;
}

export interface VQLUpdate {
    collection: string;
    search: Search;
    updater: UpdaterArg;
}

export interface VQLUpdateOne {
    collection: string;
    search: Search;
    updater: UpdaterArg;
}

export interface VQLRemove {
    collection: string;
    search: Search;
}

export interface VQLRemoveOne {
    collection: string;
    search: Search;
}

export interface VQLUpdateOneOrAdd {
    collection: string;
    search: Search;
    updater: UpdaterArg;
    add_arg?: Arg;
    id_gen?: boolean;
}

export interface VQLCollectionOperation {
    collection: string;
}

export type VQLFields = Record<string, boolean | number> | string[];

export type VQLRelations = Record<string, VQLFind | VQLFindOne>;

export interface RelationQuery {
    r: {
        path: RelationTypes.Path,
        search: Search,
        relations: RelationTypes.Relation,
        many?: boolean,
        options?: DbFindOpts,
        select?: RelationTypes.FieldPath[]
    }
}

export interface VQLRef {
    ref?: string
    var?: { [k: string]: any }
}

type VQLRefRequired = VQLRef & Required<Pick<VQLRef, "ref">>

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type VQL = (VQLRequest | RelationQuery) & VQLRef;

export type VQLR =
    | VQL // Raw VQL
    | (DeepPartial<VQL> & VQLRefRequired) // DeepPartial<VQL> + Ref
    | VQLRefRequired; // Only Ref

export interface VQLError {
    err: true;
    msg: string;
    c: number;
    why?: string;
}

export type VqlQueryRaw = VQLR | string | { query: string } & VQLRef;