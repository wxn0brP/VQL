const opPrefix = {
    "-": "remove",
    "+": "add",
    "~": "update",
    "?": "updateOneOrAdd",
    "^": "toggleOne"
};
const operations = [
    "add",
    "find", "findOne",
    "update", "updateOne",
    "remove", "removeOne",
    "updateOneOrAdd", "toggleOne",
    "ensureCollection", "issetCollection",
];
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
export function extractMeta(input) {
    // Split the input into non-empty, trimmed lines and remove comments
    const split = input
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith("#") && !line.startsWith("//"))
        .join(" ")
        .split(/\s+/)
        .filter(Boolean);
    // Ensure the query has at least database and collection
    if (split.length < 2)
        throw new Error("Invalid query");
    if (split.length === 2 && split[1] === "getCollections")
        return { db: split[0], op: "getCollections", collection: "", body: "" };
    // Handle cases like "db users" or "db users!"
    if (split.length === 2 && /^[A-Za-z]/.test(split[0])) {
        const data = extendedCollectionToData(split[1]);
        return { db: split[0], op: data.op, collection: data.collection, body: "" };
    }
    // Handle cases like "db find users"
    if (split.length === 3 && /^[A-Za-z0-9_-]+$/.test(split[2])) {
        return { db: split[0], op: split[1], collection: split[2], body: "" };
    }
    // Handle cases like "db update my.db.users s.name = 'John' u.name = 'Jane'"
    if (split.length > 3 && operations.includes(split[1])) {
        return { db: split[0], op: split[1], collection: split[2], body: split.slice(3).join(" ") };
    }
    // Default operation and initialization
    const db = split.shift();
    let op = "find";
    let collection = "";
    let body = "";
    // Determine operation and collection based on special characters
    if (["!", "-", "+", "~", "?", "^"].some(c => split[0].includes(c)) || // Check if operation is indicated by special character
        [".", ":", "{"].some(c => split[1].includes(c)) // Check if query body is indicated by special character
    ) {
        let temp = split.shift();
        const data = extendedCollectionToData(temp);
        op = data.op;
        collection = data.collection;
    }
    else {
        op = split.shift(); // Assume second word is operation
        collection = split.shift(); // Assume third word is collection
    }
    // Remaining words form the query body
    body = split.join(" ");
    return { db, op, collection, body };
}
function extendedCollectionToData(collection) {
    const firstChar = collection[0];
    const lastChar = collection[collection.length - 1];
    let op = "find";
    let collectionName = collection;
    if (opPrefix[firstChar]) {
        op = opPrefix[firstChar];
        collectionName = collectionName.slice(1);
    }
    if (lastChar === "!") {
        if (op !== "add")
            op += "One";
        collectionName = collectionName.slice(0, -1);
    }
    return { op, collection: collectionName };
}
export function convertSearchObjToSearchArray(obj, parentKeys = []) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const currentPath = [...parentKeys, key];
        if (!value) {
            return acc;
        }
        else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            return [...acc, ...convertSearchObjToSearchArray(value, currentPath)];
        }
        else {
            return [...acc, currentPath];
        }
    }, []);
}
