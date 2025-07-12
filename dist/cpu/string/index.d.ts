import { VQL } from "../../types/vql.js";
export type VQLParserMode = "VQLS" | "VQLM" | "VQLB" | "VQLR";
export declare function guessParser(query: string): {
    mode: VQLParserMode;
    query: string;
};
declare function parseStringQuery(query: string): VQL;
export { parseStringQuery };
