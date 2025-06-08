function parseInstancePath(path) {
    if (!path)
        return [];
    const unescaped = path.slice(1).replace(/~0/g, "~").replace(/~1/g, "/");
    return unescaped.split("/").filter(seg => seg !== "");
}
function formatSingleError(error) {
    const { keyword, params, message } = error;
    switch (keyword) {
        case "type":
            return `expected type: ${params.type}`;
        case "required":
            return `missing required property: ${params.missingProperty}`;
        case "additionalProperties":
            return `unexpected property: ${params.additionalProperty}`;
        case "enum":
            const allowedValues = params.allowedValues.join(", ");
            return `value not in: [${allowedValues}]`;
        case "minLength":
            return `too short (min ${params.limit} characters)`;
        case "maxLength":
            return `too long (max ${params.limit} characters)`;
        case "minimum":
            return `value < ${params.limit}`;
        case "maximum":
            return `value > ${params.limit}`;
        case "pattern":
            return `does not match pattern`;
        case "anyOf":
            return `value does not satisfy any of the variants`;
        case "oneOf":
            return `value satisfies multiple variants`;
        case "allOf":
            return `value does not satisfy all conditions`;
        default:
            return message || `validation error: ${keyword}`;
    }
}
// Recursively remove error types and leave only messages
function finalizeNode(node) {
    if (node.__errors) {
        node.__errors = node.__errors.map((e) => e.message);
    }
    for (const key in node) {
        if (key !== "__errors" && typeof node[key] === "object") {
            finalizeNode(node[key]);
        }
    }
}
export function buildAjvErrorTree(errors) {
    const errorTree = {};
    for (const error of errors) {
        const segments = parseInstancePath(error.instancePath);
        let currentNode = errorTree;
        for (const segment of segments) {
            if (!(segment in currentNode)) {
                currentNode[segment] = {};
            }
            currentNode = currentNode[segment];
        }
        const formattedMessage = formatSingleError(error);
        const isComposite = ["anyOf", "oneOf", "allOf"].includes(error.keyword);
        if (!currentNode.__errors) {
            currentNode.__errors = [];
        }
        if (isComposite) {
            // Replace all previous errors with only this general one
            currentNode.__errors = [{ keyword: error.keyword, message: formattedMessage }];
        }
        else {
            // Check if there is already a general error
            const hasComposite = currentNode.__errors.some((e) => ["anyOf", "oneOf", "allOf"].includes(e.keyword));
            if (!hasComposite) {
                currentNode.__errors.push({ keyword: error.keyword, message: formattedMessage });
            }
        }
    }
    finalizeNode(errorTree);
    return errorTree;
}
//# sourceMappingURL=ajv.js.map