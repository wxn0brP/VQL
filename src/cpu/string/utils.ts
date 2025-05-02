const opPrefix = {
    "-": "remove",
    "+": "add",
    "~": "update",
}

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
export function extractMeta(input: string) {
    // Split the input into non-empty, trimmed lines and remove comments
    const split = input
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith("#") && !line.startsWith("//"))
        .join(" ")
        .split(/\s+/)
        .filter(Boolean);

    // Ensure the query has at least database and collection
    if (split.length < 2) throw new Error("Invalid query");

    // Handle cases like "db users" or "db users!"
    if (split.length === 2 && /^[A-Za-z]/.test(split[0])) {
        let op = split[0].endsWith("!") ? "findOne" : "find";
        return { db: split[0], op, collection: split[1].replace("!", ""), body: "" };
    }

    // Handle cases like "db find users"
    if (split.length === 3) {
        return { db: split[0], op: split[1], collection: split[2], body: "" };
    }

    // Default operation and initialization
    const db = split.shift();
    let op = "find";
    let collection = "";
    let body = "";

    // Determine operation and collection based on special characters
    if (
        ["!", "-", "+", "~"].some(c => split[0].includes(c)) || // Check if operation is indicated by special character
        [".", ":", "{"].some(c => split[1].includes(c)) // Check if query body is indicated by special character
    ) {
        let temp = split.shift();
        const firstChar = temp[0];
        const lastChar = temp[temp.length - 1];
        op = opPrefix[firstChar] || "find";

        if (op !== "find") temp = temp.slice(1); // Remove operation prefix if not "find"
        if (lastChar === "!") {
            if (op !== "add") op += "One"; // Adjust operation for singular cases
            collection = temp.slice(0, -1);
        } else {
            collection = temp;
        }
    } else {
        op = split.shift(); // Assume second word is operation
        collection = split.shift(); // Assume third word is collection
    }

    // Remaining words form the query body
    body = split.join(" ");

    return { db, op, collection, body };
}
