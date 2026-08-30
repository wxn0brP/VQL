declare type Arg<T = any> = {
    [K in keyof T]?: any;
} & Record<string, any>;

/** Array Operators with nested support */
declare type ArrayOperators<T = any> = {
    /** [1, 2, 3] includes 2 */
    $arrInc?: {
        [K in keyof T]?: T[K] extends any[] ? T[K][number][] : T[K][];
    };
    /**
     * @deprecated Use $arrInc instead.
     */
    $arrinc?: {
        [K in keyof T]?: T[K] extends any[] ? T[K][number][] : T[K][];
    };
    /** [1, 2, 3] array includes all elements e.g. [1, 2] */
    $arrIncAll?: {
        [K in keyof T]?: T[K] extends any[] ? T[K][number][] : T[K][];
    };
    /**
     * @deprecated Use $arrIncAll instead.
     */
    $arrincall?: {
        [K in keyof T]?: T[K] extends any[] ? T[K][number][] : T[K][];
    };
    /** [1, 2, 3] has size 3 */
    $size?: NestedValue<T, number>;
};

/** Arrays */
declare type ArrayUpdater<T = any> = {
    /** [1,2] -> $push 3 -> [1,2,3] */
    $push?: NestedValue<T, any>;
    /** [1,2] -> $pushSet 2,3 -> [1,2,3] */
    $pushSet?: NestedValue<T, any>;
    /**
     * @deprecated Use $pushSet instead.
     */
    $pushset?: NestedValue<T, any>;
    /** [1,2,3] -> $pushAll [2,3] -> [1,2,3] */
    $pushAll?: NestedValue<T, any>;
    /**
     * @deprecated Use $pushAll instead.
     */
    $pushall?: NestedValue<T, any>;
    /** [1,2,3] -> $pull 2 -> [1,3] */
    $pull?: NestedValue<T, any>;
    /** [1,2,2,3] -> $pullAll [2] -> [1,3] */
    $pullAll?: NestedValue<T, any>;
    /**
     * @deprecated Use $pullAll instead.
     */
    $pullall?: NestedValue<T, any>;
};

declare class Collection<D = Data> {
    db: ValtheraCompatible;
    collection: string;
    constructor(db: ValtheraCompatible, collection: string);
    /**
     * Add data to a database.
     */
    add(data: Arg<D>, id_gen: false): Promise<D>;
    add(data: Arg<D>, id_gen?: true): Promise<D & {
        _id: string;
    }>;
    /**
     * Find data in a database.
     */
    find(search?: Search<D>, options?: DbFindOpts<D>, findOpts?: FindOpts<D>, context?: VContext): Promise<D[]>;
    /**
     * Find one data entry in a database.
     */
    findOne(search?: Search<D>, findOpts?: FindOpts<D>, context?: VContext): Promise<D>;
    /**
     * Update data in a database.
     */
    update(search: Search<D>, updater: Updater<D>, context?: VContext): Promise<D[]>;
    /**
     * Update one data entry in a database.
     */
    updateOne(search: Search<D>, updater: Updater<D>, context?: VContext): Promise<D | null>;
    /**
     * Remove data from a database.
     */
    remove(search: Search<D>, context?: VContext): Promise<D[]>;
    /**
     * Remove one data entry from a database.
     */
    removeOne(search: Search<D>, context?: VContext): Promise<D | null>;
    /**
     * Asynchronously updates one entry in a database or adds a new one if it doesn't exist.
     */
    updateOneOrAdd(search: Search<D>, updater: Updater<D>, { add_arg, context, id_gen }?: UpdateOneOrAdd<D>): Promise<VQueryT.UpdateOneOrAddResult<D>>;
    /**
     * Asynchronously removes one entry in a database or adds a new one if it doesn't exist. Usage e.g. for toggling a flag.
     * Returns a promise resolving to `false` if the entry was found and removed,
     * or `true` if the entry was added. The returned value reflects the state of the database
     * after the operation.
     */
    toggleOne(search: Search<D>, data?: Arg<D>, context?: VContext): Promise<VQueryT.ToggleOneResult<D>>;
}

/** Comparison Operators with nested support */
declare type ComparisonOperators<T = any> = {
    /** 5 != 4 */
    $ne?: NestedValue<T, any>;
    /** 5 > 4 */
    $gt?: NestedValue<T, number, number>;
    /** 5 < 4 */
    $lt?: NestedValue<T, number, number>;
    /** 5 >= 4 */
    $gte?: NestedValue<T, number, number>;
    /** 5 <= 4 */
    $lte?: NestedValue<T, number, number>;
    /** 5 between [min, max] */
    $between?: NestedValue<T, [
    number,
    number
    ], number>;
    /** 2 in [1, 2, 3] */
    $in?: {
        [K in keyof T]?: T[K] extends any[] ? T[K] : T[K][];
    };
    /** 5 not in [1, 2, 3] */
    $nin?: {
        [K in keyof T]?: T[K] extends any[] ? T[K] : T[K][];
    };
    /** id > 4 */
    $idGt?: NestedValue<T, string | number, string | number>;
    /** id < 4 */
    $idLt?: NestedValue<T, string | number, string | number>;
    /** id >= 4 */
    $idGte?: NestedValue<T, string | number, string | number>;
    /** id <= 4 */
    $idLte?: NestedValue<T, string | number, string | number>;
};

declare interface Data {
    [key: string]: any;
}

declare interface DbFindOpts<T = any> {
    reverse?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: KeysMatching<T, any> | {
        field: KeysMatching<T, any>;
        asc?: boolean;
    }[];
    sortAsc?: boolean;
    min?: Record<string, KeysMatching<T, number>>;
    max?: Record<string, KeysMatching<T, number>>;
    avg?: Record<string, KeysMatching<T, number>>;
    sum?: Record<string, KeysMatching<T, number>>;
    distinct?: KeysMatching<T, any>;
    groupBy?: KeysMatching<T, any> | KeysMatching<T, any>[];
    count?: Record<string, string>;
}

/** Helper type for nested path structure */
declare type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

declare type FieldPath<T = any> = KeysMatching<T, any> | (string & {}) | string[];

declare interface FindOpts<T = any> {
    select?: FieldPath<T>[];
    exclude?: FieldPath<T>[];
    transform?: Function;
}

declare type JSPrimitiveType = "string" | "number" | "boolean" | "bigint" | "symbol" | "undefined" | "function" | "object";

declare type KeysMatching<T, V, C = V> = {
    [K in keyof T]-?: T[K] extends C ? K : never;
}[keyof T];

/** Logical Operators */
declare type LogicalOperators<T = any> = {
    /**
     * Recursively applies multiple conditions, all of which must evaluate to true.
     * Can include other operators such as $gt, $exists, or nested $and/$or conditions.
     */
    $and?: Array<SearchOptions<T>>;
    /**
     * Recursively applies multiple conditions, at least one of which must evaluate to true.
     * Can include other operators such as $lt, $type, or nested $and/$or conditions.
     */
    $or?: Array<SearchOptions<T>>;
    /**
     * Negates a single condition.
     * Can include any other operator as its value.
     */
    $not?: SearchOptions<T>;
};

/** Helper type for nested path values with type filtering */
declare type NestedValue<T, V, C = V> = {
    [K in keyof T as T[K] extends C ? K : T[K] extends object ? K : never]?: T[K] extends C ? V : T[K] extends object ? NestedValue<T[K], V, C> : never;
};

/** Objects */
declare type ObjectUpdater<T = any> = {
    /** { a: 1 } -> $merge { b: 2 } -> { a: 1, b: 2 } */
    $merge?: NestedValue<T, any>;
    /** { a: { x: 1 } } -> $deepMerge { a: { y: 2 } } -> { a: { x: 1, y: 2 } } */
    $deepMerge?: NestedValue<T, any>;
};

/** Other Operators with nested support */
declare type OtherOperators<T = any> = {
    /** { $type: "name" } matches { $type: "name" } literally - Ignore $ operators */
    $subset?: DeepPartial<T>;
};

/** Predefined Search Operators */
declare type PredefinedSearchOperators<T = any> = LogicalOperators<T> & ComparisonOperators<T> & TypeAndExistenceOperators<T> & ArrayOperators<T> & StringOperators<T> & OtherOperators<T>;

declare namespace RelationTypes {
    type Path = [
    string,
    string
    ];
    type FieldPath = string[];
    interface DBS {
        [key: string]: ValtheraCompatible;
    }
    interface Relation {
        [key: string]: RelationConfig;
    }
    interface RelationConfig {
        path: Path;
        pk?: string;
        fk?: string;
        as?: string;
        select?: string[];
        dbFindOpts?: DbFindOpts;
        type?: "1" | "11" | "1n" | "nm";
        relations?: Relation;
        through?: {
            table: string;
            db?: string;
            pk: string;
            fk: string;
        };
    }
}

declare type Search<T = any, AllowFn extends boolean = true> = AllowFn extends true ? SearchOptions<T> | SearchFunc<T> : SearchOptions<T>;

declare type SearchFunc<T = any> = (data: T, context: VContext) => boolean;

/**
 * SearchOptions can be either a function or an object with predefined operators.
 */
declare type SearchOptions<T = any> = PredefinedSearchOperators<T> & DeepPartial<T> & Record<string, any>;

/** String Operators with nested support */
declare type StringOperators<T = any> = {
    /** "John" matches /oh/ */
    $regex?: NestedValue<T, RegExp | string, string>;
    /** "John" starts with "Jo" */
    $startsWith?: NestedValue<T, string, string>;
    /** "John" ends with "hn" */
    $endsWith?: NestedValue<T, string, string>;
    /** "John" starts with "jo" (case-insensitive) */
    $iStartsWith?: NestedValue<T, string, string>;
    /** "John" ends with "HN" (case-insensitive) */
    $iEndsWith?: NestedValue<T, string, string>;
};

/** Type and Existence Operators with nested support */
declare type TypeAndExistenceOperators<T = any> = {
    /** "name" in { name: "John" } */
    $exists?: NestedValue<T, boolean, any>;
    /** "name" == "string" in { name: "John" } */
    $type?: NestedValue<T, JSPrimitiveType, any>;
};

declare interface UpdateOneOrAdd<T> {
    add_arg?: Arg<T>;
    id_gen?: boolean;
    context?: VContext;
}

declare type Updater<T = any, AllowFn extends boolean = true> = AllowFn extends true ? UpdaterArg<T> | UpdaterFunc<T> : UpdaterArg<T>;

declare type UpdaterArg<T = any> = ArrayUpdater<T> & ObjectUpdater<T> & ValueUpdater<T> & DeepPartial<T> & Record<string, any>;

declare type UpdaterFunc<T = any> = (data: T, context: VContext) => Data | void;

declare interface ValtheraCompatible {
    c<T = Data>(collection: string): Collection<T>;
    getCollections(): Promise<string[]>;
    ensureCollection(collection: string): Promise<boolean>;
    issetCollection(collection: string): Promise<boolean>;
    add<T = Data>(query: VQueryT.Add<T>): Promise<T>;
    find<T = Data>(query: VQueryT.Find<T>): Promise<T[]>;
    findOne<T = Data>(query: VQueryT.FindOne<T>): Promise<T | null>;
    update<T = Data>(query: VQueryT.Update<T>): Promise<T[]>;
    updateOne<T = Data>(query: VQueryT.Update<T>): Promise<T | null>;
    remove<T = Data>(query: VQueryT.Remove<T>): Promise<T[]>;
    removeOne<T = Data>(query: VQueryT.Remove<T>): Promise<T | null>;
    removeCollection(collection: string): Promise<boolean>;
    updateOneOrAdd<T = Data>(query: VQueryT.UpdateOneOrAdd<T>): Promise<VQueryT.UpdateOneOrAddResult<T>>;
    toggleOne<T = Data>(query: VQueryT.ToggleOne<T>): Promise<VQueryT.ToggleOneResult<T>>;
}

/** Values */
declare type ValueUpdater<T = any> = {
    /** { count: 1 } -> $inc 2 -> { count: 3 } */
    $inc?: NestedValue<T, number>;
    /** { count: 5 } -> $dec 2 -> { count: 3 } */
    $dec?: NestedValue<T, number>;
    /** { name: "John" } -> $unset "name" -> {} */
    $unset?: NestedValue<T, any>;
    /** { oldName: "value" } -> $rename "oldName" to "newName" -> { newName: "value" } */
    $rename?: NestedValue<T, any>;
    /**
     * {} -> $set { name: "John" } -> { name: "John" }
     *
     * Note: same as { name: value }
     */
    $set?: NestedValue<T, any>;
};

declare interface VContext {
    [key: string]: any;
}

export declare type VQL_Fields = Record<string, boolean | number> | string[];

export declare interface VQL_OP_Add<T = any> {
    collection: string;
    data: Arg<T>;
    id_gen?: boolean;
}

export declare interface VQL_OP_CollectionOperation {
    collection: string;
}

export declare interface VQL_OP_Find<T = any> {
    collection: string;
    search?: Search<T>;
    limit?: number;
    select?: VQL_Fields;
    options?: DbFindOpts<T>;
    searchOpts?: FindOpts<T>;
}

export declare interface VQL_OP_FindOne<T = any> {
    collection: string;
    search: Search<T>;
    select?: VQL_Fields;
    searchOpts?: FindOpts<T>;
}

export declare interface VQL_OP_Remove<T = any> {
    collection: string;
    search: Search<T>;
    select?: VQL_Fields;
}

export declare interface VQL_OP_ToggleOne<T = any> {
    collection: string;
    search: Search<T>;
    data?: Arg<T>;
    select?: VQL_Fields;
}

export declare interface VQL_OP_Update<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
    select?: VQL_Fields;
}

export declare interface VQL_OP_UpdateOneOrAdd<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
    add_arg?: Arg<T>;
    id_gen?: boolean;
    select?: VQL_Fields;
}

/** VQL Query */
export declare type VQL_Query<T = any> = (VQL_Query_CRUD<T> | VQL_Query_Relation) & VQL_Var;

export declare interface VQL_Query_CRUD<T = any> {
    db: string;
    d: VQL_Query_CRUD_Data<T>;
}

export declare type VQL_Query_CRUD_Data<T = any> = {
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

export declare type VQL_Query_CRUD_Keys = VQL_Query_CRUD_Data extends infer U ? U extends Record<string, unknown> ? keyof U : never : never;

export declare interface VQL_Query_Relation {
    r: {
        path: RelationTypes.Path;
        search: Search;
        relations: RelationTypes.Relation;
        many?: boolean;
        options?: DbFindOpts;
        select?: RelationTypes.FieldPath[] | Record<string, any>;
    };
}

export declare interface VQL_Var {
    var?: {
        [k: string]: any;
    };
}

export declare interface VQLError {
    err: true;
    msg: string;
    c: number;
}

/** VQL Universal Query */
export declare type VQLUQ<T = any> = VQL_Query<T> | string | ({
    query: string;
} & VQL_Var);

export declare interface VQuery<T = Data, AllowFn extends boolean = true> {
    /** logic path, dir or file, depends on context */
    collection?: string;
    search?: Search<T, AllowFn>;
    context?: VContext;
    dbFindOpts?: DbFindOpts<T>;
    findOpts?: FindOpts<T>;
    data?: Arg<T>;
    id_gen?: boolean;
    add_arg?: Arg<T>;
    updater?: Updater<T, AllowFn>;
    control?: VQuery_Control;
}

/**
 * To extend via adapters
 * @example
 * declare module "@wxn0brp/db-core/types/query" {
 *   export interface VQuery_Control {
 *     key?: "value";
 *   }
 * }
 */
export declare interface VQuery_Control {
}

export declare namespace VQueryT {
    export type QueryBase<T = Data> = {
        collection: string;
        control?: VQuery_Control;
    };
    export type Add<T = Data> = QueryBase<T> & {
        data: Arg<T>;
        id_gen?: boolean;
    };
    export type Find<T = Data, AllowFn extends boolean = true> = QueryBase<T> & {
        search?: Search<T, AllowFn>;
        findOpts?: FindOpts<T>;
        dbFindOpts?: DbFindOpts<T>;
        context?: VContext;
    };
    export type FindOne<T = Data, AllowFn extends boolean = true> = QueryBase<T> & {
        search: Search<T, AllowFn>;
        findOpts?: FindOpts<T>;
        context?: VContext;
    };
    export type Update<T = Data, AllowFn extends boolean = true> = QueryBase<T> & {
        search: Search<T, AllowFn>;
        updater: Updater<T, AllowFn>;
        context?: VContext;
    };
    export type Remove<T = Data, AllowFn extends boolean = true> = QueryBase<T> & {
        search: Search<T, AllowFn>;
        context?: VContext;
    };
    export type UpdateOneOrAdd<T = Data, AllowFn extends boolean = true> = QueryBase<T> & {
        search: Search<T, AllowFn>;
        updater: Updater<T, AllowFn>;
        add_arg?: Arg<T>;
        id_gen?: boolean;
        context?: VContext;
    };
    export type ToggleOne<T = Data, AllowFn extends boolean = true> = QueryBase<T> & {
        search: Search<T, AllowFn>;
        data: Arg<T>;
        context?: VContext;
    };
    export interface UpdateOneOrAddResult<T> {
        data: T;
        type: "added" | "updated";
    }
    export interface ToggleOneResult<T> {
        data: T;
        type: "added" | "removed";
    }
}

export { }
