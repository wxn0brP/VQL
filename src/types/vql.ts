import { RelationTypes } from "@wxn0brp/db";
import { Search, Arg } from "@wxn0brp/db-core/types/arg";
import { DbFindOpts, FindOpts } from "@wxn0brp/db-core/types/options";
import { UpdaterArg } from "@wxn0brp/db-core/types/updater";

export interface VQLQuery<T = any> {
    find: VQLFind<T>,
    findOne: VQLFindOne<T>,
    f: VQLFindOne<T>,
    add: VQLAdd<T>,
    update: VQLUpdate<T>,
    updateOne: VQLUpdateOne<T>,
    remove: VQLRemove<T>,
    removeOne: VQLRemoveOne<T>,
    updateOneOrAdd: VQLUpdateOneOrAdd<T>,
    removeCollection: VQLCollectionOperation,
    ensureCollection: VQLCollectionOperation,
    issetCollection: VQLCollectionOperation,
    getCollections: {}
}

export type VQLQueryData<T = any> =
    | { find: VQLFind<T> }
    | { findOne: VQLFindOne<T> }
    | { f: VQLFindOne<T> }
    | { add: VQLAdd<T> }
    | { update: VQLUpdate<T> }
    | { updateOne: VQLUpdateOne<T> }
    | { remove: VQLRemove<T> }
    | { removeOne: VQLRemoveOne<T> }
    | { updateOneOrAdd: VQLUpdateOneOrAdd<T> }
    | { removeCollection: VQLCollectionOperation }
    | { ensureCollection: VQLCollectionOperation }
    | { issetCollection: VQLCollectionOperation }
    | { getCollections: {} }

export interface VQLRequest<T = any> {
    db: string;
    d: VQLQueryData<T>;
}

export interface VQLFind<T = any> {
    collection: string;
    search?: Search<T>;
    limit?: number;
    fields?: VQLFields;
    select?: VQLFields;
    relations?: VQLRelations;
    options?: DbFindOpts<T>;
    searchOpts?: FindOpts<T>;
}

export interface VQLFindOne<T = any> {
    collection: string;
    search: Search<T>;
    fields?: VQLFields;
    select?: VQLFields;
    relations?: VQLRelations;
    searchOpts?: FindOpts<T>;
}

export interface VQLAdd<T = any> {
    collection: string;
    data: Arg<T>;
    id_gen?: boolean;
}

export interface VQLUpdate<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
}

export interface VQLUpdateOne<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
}

export interface VQLRemove<T = any> {
    collection: string;
    search: Search<T>;
}

export interface VQLRemoveOne<T = any> {
    collection: string;
    search: Search<T>;
}

export interface VQLUpdateOneOrAdd<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
    add_arg?: Arg<T>;
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

export type VQL<T = any> = (VQLRequest<T> | RelationQuery) & VQLRef;

export type VQLR<T = any> =
    | VQL<T> // Raw VQL
    | (DeepPartial<VQL<T>> & VQLRefRequired) // DeepPartial<VQL> + Ref
    | VQLRefRequired; // Only Ref

export interface VQLError {
    err: true;
    msg: string;
    c: number;
    why?: string;
}

export type VqlQueryRaw<T = any> = VQLR<T> | string | { query: string } & VQLRef;