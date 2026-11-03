import { VQL_Query_CRUD } from "../types/vql.js";
export type LowResolver = (query: VQL_Query_CRUD, user: any) => Promise<any> | any;
export declare class LowAdapter {
    resolver: LowResolver;
    constructor(resolver: LowResolver);
}
