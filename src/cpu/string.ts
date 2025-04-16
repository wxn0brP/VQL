import { RelationTypes } from "@wxn0brp/db";
import { VQL, VQLR } from "../types/vql";

interface ProcessedQuery {
    operation: string;
    name: string;
    opts?: Record<string, any>;
    body: Record<string, any>;
    hasRelations: boolean;
}

function parseQuery(query: string): ProcessedQuery {
    const tokens = tokenize(query);
    let index = 0;
    let hasRelations = false;

    function peek(): string | undefined {
        return tokens[index];
    }

    function next(): string {
        return tokens[index++];
    }

    function expect(value: string): void {
        const token = next();
        if (token !== value) throw new Error(`Expected ${value}, got ${token}`);
    }

    function parseValue(): any {
        const tok = next();
        if (tok === '{') {
            const obj: Record<string, any> = {};
            while (peek() !== '}') {
                const key = next();
                const val = parseValue();
                obj[key] = val;
            }
            next(); // skip '}'
            return obj;
        } else if (!isNaN(Number(tok))) {
            return Number(tok);
        } else if (tok === 'true') {
            return true;
        } else if (tok === 'false') {
            return false;
        } else {
            return tok;
        }
    }

    function parseOpts(): Record<string, any> | undefined {
        if (peek() === '(') {
            next(); // skip '('
            const opts: Record<string, any> = {};
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

    function parseBlock(): { select: string[]; relations: Record<string, any> } {
        const select: string[] = [];
        const relations: Record<string, any> = {};

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
            } else {
                select.push(key);
            }
        }
        next(); // skip '}'

        return { select, relations };
    }

    // entry point
    const operation = next(); // find
    const name = next();      // table
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

function tokenize(str: string): string[] {
    const regex = /([{}()])|([a-zA-Z0-9_]+)|"(.*?)"|'(.*?)'/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(str))) {
        tokens.push(match[1] || match[2] || match[3] || match[4]);
    }
    return tokens;
}

function changeQueryToVQLR(query: ProcessedQuery): VQL {
    return query.hasRelations ? processRelation(query) : processStandard(query);
}

function processStandard(query: ProcessedQuery): VQL {
    const {
        operation,
        name,
        body
    } = query;
    let opts = (query.opts || {});

    if (operation === "find" || operation === "findOne") {
        opts = {
            select: body.select,
            ...opts,
        }
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
    } as any;
}

function processRelation(query: ProcessedQuery): VQL {
    const {
        body,
        name,
        opts,
        operation
    } = query;
    if (operation !== "find" && operation !== "findOne") {
        throw new Error(`Invalid operation ${operation} for relations`);
    }

    const relations: RelationTypes.Relation = {};

    for (const key in body.relations) {
        const value = body.relations[key];
        relations[key] = {
            path: [value.db as any || opts.db as string, opts.c || key],
            select: value.select,
            ...(value.opts ? value.opts : {}),
        };
    }

    return {
        r: {
            path: [opts.db as string, name],
            search: opts.search as any || {},
            relations,
            many: operation === "find",
        }
    };
}

export function parseStringQuery(query: string): VQLR {
    const parsed = parseQuery(query);
    return changeQueryToVQLR(parsed);
}