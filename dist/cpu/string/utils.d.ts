/**
 * Extracts metadata from a query string, including database name, operation,
 * collection name, and the query body.
 *
 * @param input The input string to extract the information from.
 * @returns An object with the following properties:
 *  - `db`: The database name.
 *  - `op`: The operation to perform, such as "find", "findOne", "add", "update", or "remove".
 *  - `collection`: The collection name.
 *  - `body`: The query body.
 */
export declare function extractMeta(input: string): {
    db: string;
    op: string;
    collection: string;
    body: string;
};
