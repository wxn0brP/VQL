export function readFileSync(path, encoding = "utf8") {
    const xhr = new XMLHttpRequest();
    if (path.includes("schema.json")) path = window.VQL?.schemaPath || "https://cdn.jsdelivr.net/gh/wxn0brP/VQL/schema.json";

    xhr.open("GET", path, false); // sync
    try {
        xhr.send();
    } catch (e) {
        throw new Error(`readFileSync failed for path: ${path}`);
    }

    if (xhr.status >= 200 && xhr.status < 300) {
        return encoding === "utf8" ? xhr.responseText : xhr.response;
    } else {
        throw new Error(`readFileSync failed with status ${xhr.status} for path: ${path}`);
    }
}

export function existsSync(path) {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", path, false); // sync
    try {
        xhr.send();
        return xhr.status >= 200 && xhr.status < 300;
    } catch {
        return false;
    }
}

export function mkdirSync(path, options) {
    console.warn(`mkdirSync called on browser fs shim — ignored: ${path}`);
}

export function writeFileSync(path, data, options) {
    console.warn(`writeFileSync called on browser fs shim — ignored: ${path}`);
}

export function readdirSync(path) {
    console.warn(`readDirSync called on browser fs shim — ignored: ${path}`);
    return [];
}