import { VQL_Query } from "./types/vql";

function replaceVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === "object" && !Array.isArray(obj) && obj !== null && "__" in obj) {
        const varKey = obj.__;
        return variables[varKey] ?? obj;
    }

    if (typeof obj === "string") {
        if (obj.startsWith("$")) 
            return variables[obj.slice(1)] ?? obj;
        
        return obj;
    }

    if (Array.isArray(obj))
        return obj.map((item) => replaceVariables(item, variables));

    if (typeof obj === "object" && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = replaceVariables(obj[key], variables);
        }
        return newObj;
    }

    return obj;
}

export function replaceVars(query: VQL_Query, user: any): VQL_Query {
    query.var = {
        _me: user?.id || user?._id || user,
        _now: Date.now(),
        _nowShort: Math.floor(Date.now() / 1000),
        __now: Date.now().toString(),
        __nowShort: Math.floor(Date.now() / 1000).toString(),
        ...(query.var || {})
    }
    query = replaceVariables(query, query.var);
    delete query.var;

    return query as VQL_Query;
}