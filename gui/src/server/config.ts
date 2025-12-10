import { Remote, ValtheraAutoCreate, ValtheraCompatible } from "@wxn0brp/db";
import { UserManager, WardenManager } from "@wxn0brp/gate-warden";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

if (!existsSync("config")) mkdirSync("config");
if (!existsSync("config/dbs.list.json")) writeFileSync("config/dbs.list.json", "{}");
if (!existsSync("config/gw.json")) writeFileSync("config/gw.json", "");

export const config: {
    dbsList: Record<string, Remote>,
    mgr: WardenManager,
    gwDB: ValtheraCompatible,
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
    config.gwDB = ValtheraAutoCreate(gwCfg);
    config.mgr = new WardenManager(config.gwDB as any);
    config.user = new UserManager(config.gwDB as any);
}



