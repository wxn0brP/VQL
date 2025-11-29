import { VQL_Query_CRUD } from "#types/vql";

export type LowResolver = (query: VQL_Query_CRUD, user: any) => Promise<any> | any;

export class LowAdapter {
    constructor(public resolver: LowResolver) { }
}