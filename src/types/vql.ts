import { DbFindOpts, RelationConfig, Search } from "@wxn0brp/db";

export type VQLQuery = {
    find: VQLFind,
    findOne: VQLFindOne,
    f: VQLFindOne,
    add: VQLAdd,
    update: VQLUpdate,
    updateOne: VQLUpdateOne,
    remove: VQLRemove,
    removeOne: VQLRemoveOne,
    updateOneOrAdd: VQLUpdateOneOrAdd
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

export interface VQLRequest {
    db: string;
    d: VQLQueryData;
}

export interface VQLRequest {
    db: string;
    d: VQLQueryData;
}

export interface VQLFind {
    collection: string;
    search?: Record<string, any>;
    sort?: Record<string, "asc" | "desc">;
    limit?: number;
    fields?: VQLFields;
    relations?: VQLRelations;
}

export interface VQLFindOne {
    collection: string;
    search: Record<string, any>;
    fields?: VQLFields;
    relations?: VQLRelations;
}

export interface VQLAdd {
    collection: string;
    data: Record<string, any>;
}

export interface VQLUpdate {
    collection: string;
    search: Record<string, any>;
    updater: Record<string, any>;
}

export interface VQLUpdateOne {
    collection: string;
    search: Record<string, any>;
    updater: Record<string, any>;
}

export interface VQLRemove {
    collection: string;
    search: Record<string, any>;
}

export interface VQLRemoveOne {
    collection: string;
    search: Record<string, any>;
}

export interface VQLUpdateOneOrAdd {
    collection: string;
    search: Record<string, any>;
    updater: Record<string, any>;
    add_arg?: Record<string, any>;
    id_gen?: boolean;
}

export type VQLFields = Record<string, boolean | number>;

export type VQLRelations = Record<string, VQLFind | VQLFindOne>;

export interface RelationQuery {
    r: {
        path: string,
        search: Search,
        relations: Record<string, RelationConfig>,
        many?: boolean,
        options?: DbFindOpts,
    }
}

export type VQL = VQLRequest | RelationQuery;