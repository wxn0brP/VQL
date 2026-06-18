export function parseArgs(input) {
    const result = {};
    const tokens = [];
    let current = "";
    let inQuotes = false;
    let escape = false;
    let objTree = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (escape) {
            current += char;
            escape = false;
        }
        else if (char === "\\") {
            escape = true;
        }
        else if (!inQuotes && (char === "{" || char === "[")) {
            objTree++;
            current += char;
        }
        else if (!inQuotes && (char === "}" || char === "]")) {
            objTree--;
            current += char;
            if (objTree === 0) {
                tokens.push(current);
                current = "";
            }
        }
        else if (!objTree && (char === "'" || char === '"' || char === "`")) {
            if (inQuotes === char) {
                inQuotes = false;
                tokens.push(`"` + current + `"`);
                current = "";
            }
            else if (typeof inQuotes === "boolean") {
                inQuotes = char;
            }
            else {
                current += char;
            }
        }
        else if (!inQuotes && (char === " " || char === "=" || char === "<" || char === ">")) {
            if (current !== "") {
                if (char === "<" || char === ">") {
                    let type = char === ">" ? "gt" : "lt";
                    if (i < input.length - 1 && input[i + 1] === "=") {
                        type += "e";
                        i++;
                    }
                    const split = current.split(".");
                    if (split.length > 1) {
                        const original = split.shift();
                        const operation = "$" + type;
                        split.unshift(operation);
                        split.unshift(original);
                        current = split.join(".");
                    }
                    else {
                        current = "$" + type + "." + current;
                    }
                }
                tokens.push(current);
                current = "";
            }
        }
        else {
            current += char;
        }
    }
    if (current !== "")
        tokens.push(current);
    for (let i = 0; i < tokens.length; i += 2) {
        const key = tokens[i];
        let value = tokens[i + 1] ?? true;
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed === "") {
                value = true;
            }
            else if (/^".*"$/.test(trimmed)) {
                value = trimmed.slice(1, -1);
            }
            else if (trimmed.toLowerCase() === "true") {
                value = true;
            }
            else if (trimmed.toLowerCase() === "false") {
                value = false;
            }
            else if (!isNaN(Number(trimmed))) {
                value = Number(trimmed);
            }
            else if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                try {
                    value = JSON.parse(trimmed);
                }
                catch { }
            }
        }
        result[key] = value;
    }
    return result;
}
