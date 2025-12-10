import crypto from "crypto";
import { watch } from "fs";
import { config, loadConfig } from "./config";
import { buildTree } from "./struct";
import FalconFrame from "@wxn0brp/falcon-frame";

const app = new FalconFrame();

app.static("/", "public");
app.static("/", "dist/front");

loadConfig();
let lastRefresh: NodeJS.Timeout;
watch("config").addListener("change", () => {
    if (lastRefresh) clearTimeout(lastRefresh);
    lastRefresh = setTimeout(() => {
        loadConfig();
    }, 1000);
});
let hidePath: boolean = true;

export function hashKey(path: any): string {
    const json = typeof path === "string" ? path : JSON.stringify(path);
    if (hidePath)
        return crypto.createHash("sha256").update(json).digest("hex");
    else
        return json;
}

app.get("/hidePath", (req, res) => {
    hidePath = req.query.hidePath !== "false";
    res.json({ success: true });
})

app.get("/tree", async (req, res) => {
    const tree = await buildTree();
    res.json(tree);
});

app.get("/list", async (req, res) => {
    const { entityId } = req.query;

    if (!entityId) {
        res.status(400).json({ error: "Missing entityId" });
        return;
    }

    const hash = hashKey(entityId);
    const rules = await config.gwDB.find("acl/" + hash, {});

    res.json(rules);
});

app.post("/add", async (req, res) => {
    const { userId, permissions, entityId } = req.body;

    if (!permissions || !entityId) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }

    await config.mgr.addACLRule(hashKey(entityId), permissions, userId || undefined);

    res.json({ success: true });
})

app.post("/remove", async (req, res) => {
    const { userId, entityId } = req.body;

    if (!entityId) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }

    await config.mgr.removeACLRule(hashKey(entityId), userId || undefined);

    res.json({ success: true });
})

app.l(36777);