import { Remote } from "@wxn0brp/db/client/remote.js";
import { GateWarden, UserManager, WardenManager } from "@wxn0brp/gate-warden";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { createDatabase } from "./struct";
import { Valthera, ValtheraRemote } from "@wxn0brp/db";

if (!existsSync("config")) mkdirSync("config");
if (!existsSync("config/dbs.list.json")) writeFileSync("config/dbs.list.json", "{}");
if (!existsSync("config/gw.json")) writeFileSync("config/gw.json", "");

export const config: {
    dbsList: {
        [key: string]: string | Remote
    },
    mgr: WardenManager,
    gwDB: Valthera | ValtheraRemote,
    user: UserManager
} = {
    dbsList: {},
    mgr: null,
    gwDB: null,
    user: null
}

export function loadConfig() {
    config.dbsList = JSON.parse(readFileSync("config/dbs.list.json", "utf-8"));
    const gwCfg = JSON.parse(readFileSync("config/gw.json", "utf-8"));
    config.gwDB = createDatabase(gwCfg);
    config.mgr = new WardenManager(config.gwDB as any);
    config.user = new UserManager(config.gwDB as any);
}



