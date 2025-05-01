const opPrefix = {
    "-": "remove",
    "+": "add",
    "~": "update",
}

export function extractMeta(input: string) {
    const split = input
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith("#") && !line.startsWith("//"))
        .join(" ")
        .split(/\s+/)
        .filter(Boolean);

    if (split.length < 3) throw new Error("Invalid query");

    const db = split.shift();
    let op = "find";
    let collection = "";
    let body = "";

    if ([".", ":", "{"].some(c => split[1].includes(c))) {
        let temp = split.shift();

        const firstChar = temp[0];
        const lastChar = temp[temp.length - 1];
        op = opPrefix[firstChar] || "find";

        if (op !== "find") temp = temp.slice(1);
        if (lastChar === "!") {
            if (op !== "add") op += "One";
            collection = temp.slice(0, -1);
        } else {
            collection = temp;
        }
    } else {
        op = split.shift();
        collection = split.shift();
    }

    body = split.join(" ");

    return { db, op, collection, body };
}