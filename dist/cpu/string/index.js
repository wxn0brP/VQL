import logger from "../../logger.js";
import { parseVQLB } from "./json5.js";
import { parseVQLS } from "./simple.js";
import { parseVQLM } from "./yaml.js";
function get3rdAnd4thWord(query) {
    let words = [];
    let word = "";
    let i = 0;
    while (i < query.length && words.length < 4) {
        const c = query[i++];
        if (" \t\n\r".includes(c)) {
            if (word)
                words.push(word);
            word = "";
        }
        else {
            word += c;
        }
    }
    if (word && words.length < 4)
        words.push(word);
    return words[2] + (words[3] ? " " + words[3] : "");
}
export function guessParser(query) {
    query = query.trimStart();
    if (query[0] === "#") {
        return {
            mode: "VQL" + query[1].toUpperCase(),
            query: query.slice(2)
        };
    }
    const _34word = get3rdAnd4thWord(query);
    let mode = "VQLS";
    if (_34word.includes("{"))
        mode = "VQLB";
    else if (_34word.includes(":"))
        mode = "VQLM";
    return {
        mode,
        query
    };
}
function parseStringQuery(query) {
    const { mode, query: queryRaw } = guessParser(query);
    logger.debug("Query mode: " + mode);
    if (mode === "VQLB") {
        return parseVQLB(queryRaw);
    }
    else if (mode === "VQLM") {
        return parseVQLM(queryRaw);
    }
    else {
        return parseVQLS(queryRaw);
    }
}
export { parseStringQuery };
//# sourceMappingURL=index.js.map