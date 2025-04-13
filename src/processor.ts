import { Relation, RelationTypes, Valthera } from "@wxn0brp/db";
import { GateWarden } from '@wxn0brp/gate-warden';
import { RelationQuery, VQL, VQLQuery, VQLR, VQLRequest } from "./types/vql";
import { checkRelationPermission, checkRequestPermission } from "./permissions";
import { validateRaw, validateVql } from "./valid";
import { executeSheet } from "./sheet";

function standardizeRelationRequest(req: RelationTypes.Relation | RelationQuery["r"]) {
    if (!req.select) req.select = [];
}

export class VQLProcessor {
    private dbInstances: Record<string, Valthera>;
    private gw?: GateWarden<any>;
    private relation: Relation;
    public preDefinedSheets: Map<string, VQL> = new Map();

    constructor(dbInstances: Record<string, Valthera>, gw?: GateWarden<any>) {
        this.dbInstances = dbInstances;
        this.gw = gw;
        this.relation = new Relation(dbInstances);
    }

    async execute(queryRaw: VQLR, user: any): Promise<any> {
        if (!validateRaw(queryRaw)) return { err: true, msg: "Invalid query", c: 400 };

        const query = executeSheet(queryRaw, this.preDefinedSheets);

        if (!validateVql(query)) return { err: true, msg: "Invalid query", c: 400 };

        if ("r" in query) {
            return await this.executeRelation(query, user);
        } else if ("d" in query) {
            return await this.executeQuery(query, user);
        } else {
            return { err: true, msg: "Invalid query", c: 400 };
        }
    }

    private async executeQuery(query: VQLRequest, user: any): Promise<any> {
        if (!query.db || !this.dbInstances[query.db]) throw new Error("Invalid DB");
        const db = this.dbInstances[query.db];

        const operation = Object.keys(query.d)[0] as keyof VQLQuery;

        if (!await checkRequestPermission(this.gw, user, query)) {
            throw new Error("Permission denied");
        }

        if (operation === "find") {
            const params = query.d[operation];
            const fields = params.fields || {};
            return db.find(params.collection, params.search, {}, {}, { select: Object.keys(fields).filter(k => !!fields[k]) });
        } else if (operation === "findOne" || operation === "f") {
            const params = query.d[operation];
            const fields = params.fields || {};
            return db.findOne(params.collection, params.search, {}, { select: Object.keys(fields).filter(k => !!fields[k]) });
        } else if (operation === "add") {
            const params = query.d[operation];
            return db.add(params.collection, params.data);
        } else if (operation === "update") {
            const params = query.d[operation];
            return db.update(params.collection, params.search, params.updater);
        } else if (operation === "updateOne") {
            const params = query.d[operation];
            return db.updateOne(params.collection, params.search, params.updater);
        } else if (operation === "remove") {
            const params = query.d[operation];
            return db.remove(params.collection, params.search);
        } else if (operation === "removeOne") {
            const params = query.d[operation];
            return db.removeOne(params.collection, params.search);
        } else if (operation === "updateOneOrAdd") {
            const params = query.d[operation];
            return db.updateOneOrAdd(params.collection, params.search, params.updater, params.add_arg || {}, {}, params.id_gen ?? true);
        } else {
            const n: never = operation;
            throw new Error("Unknown operation " + n);
        }
    }

    private async executeRelation(query: RelationQuery, user: any): Promise<any> {
        if (!await checkRelationPermission(this.gw, user, query)) {
            throw new Error("Permission denied");
        }

        const req = query.r;
        standardizeRelationRequest(req);

        if (req.many) {
            return await this.relation.find(req.path, req.search, req.relations, req.select, req.options);
        } else {
            return await this.relation.findOne(req.path, req.search, req.relations, req.select);
        }
    }
}
