import { VQL } from "../../types/vql.js";
export declare function processVQL_MB(db: string, op: string, collection: string, parsed: Record<string, any>): VQL;
export declare function convertSearchObjToSearchArray(obj: Record<string, any>, parentKeys?: string[]): string[][];
