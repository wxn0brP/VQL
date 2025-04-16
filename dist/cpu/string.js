function parseQuery(query) {
    const tokens = tokenize(query);
    let index = 0;
    let hasRelations = false;
    function peek() {
        return tokens[index];
    }
    function next() {
        return tokens[index++];
    }
    function expect(value) {
        const token = next();
        if (token !== value)
            throw new Error(`Expected ${value}, got ${token}`);
    }
    function parseValue() {
        const tok = next();
        if (tok === '{') {
            const obj = {};
            while (peek() !== '}') {
                const key = next();
                const val = parseValue();
                obj[key] = val;
            }
            next(); // skip '}'
            return obj;
        }
        else if (!isNaN(Number(tok))) {
            return Number(tok);
        }
        else if (tok === 'true') {
            return true;
        }
        else if (tok === 'false') {
            return false;
        }
        else {
            return tok;
        }
    }
    function parseOpts() {
        if (peek() === '(') {
            next(); // skip '('
            const opts = {};
            while (peek() !== ')') {
                const key = next();
                const val = parseValue();
                opts[key] = val;
            }
            next(); // skip ')'
            return opts;
        }
        return undefined;
    }
    function parseBlock() {
        const select = [];
        const relations = {};
        expect('{');
        while (peek() !== '}') {
            const key = next();
            const relOpts = parseOpts();
            if (peek() === '{') {
                const body = parseBlock();
                relations[key] = {
                    ...(relOpts && { opts: relOpts }),
                    ...body
                };
                hasRelations = true;
            }
            else {
                select.push(key);
            }
        }
        next(); // skip '}'
        return { select, relations };
    }
    // entry point
    const operation = next(); // find
    const name = next(); // table
    const opts = parseOpts(); // (opts)?
    const body = parseBlock();
    return {
        operation,
        name,
        ...(opts && { opts }),
        body,
        hasRelations
    };
}
function tokenize(str) {
    const regex = /([{}()])|([a-zA-Z0-9_]+)|"(.*?)"|'(.*?)'/g;
    const tokens = [];
    let match;
    while ((match = regex.exec(str))) {
        tokens.push(match[1] || match[2] || match[3] || match[4]);
    }
    return tokens;
}
function changeQueryToVQLR(query) {
    return query.hasRelations ? processRelation(query) : processStandard(query);
}
function processStandard(query) {
    const { operation, name, body } = query;
    let opts = (query.opts || {});
    if (operation === "find" || operation === "findOne") {
        opts = {
            select: body.select,
            ...opts,
        };
    }
    const db = opts.db;
    delete opts.db;
    return {
        db,
        d: {
            [operation]: {
                collection: name,
                ...opts,
            }
        }
    };
}
function processRelation(query) {
    const { body, name, opts, operation } = query;
    if (operation !== "find" && operation !== "findOne") {
        throw new Error(`Invalid operation ${operation} for relations`);
    }
    const relations = {};
    for (const key in body.relations) {
        const value = body.relations[key];
        relations[key] = {
            path: [value.db || opts.db, opts.c || key],
            select: value.select,
            ...(value.opts ? value.opts : {}),
        };
    }
    return {
        r: {
            path: [opts.db, name],
            search: opts.search || {},
            relations,
            many: operation === "find",
        }
    };
}
export function parseStringQuery(query) {
    const parsed = parseQuery(query);
    return changeQueryToVQLR(parsed);
}
//# sourceMappingURL=string.js.map