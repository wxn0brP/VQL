import { ValtheraAutoRemoteCreate, ValtheraCompatible } from "@wxn0brp/db";
import { config } from "./config";

interface TreeNode {
    name: string;
    children?: TreeNode[];
}

async function fetchCollections(db: ValtheraCompatible): Promise<string[]> {
    return await db.getCollections();
}

async function inferFields(
    db: ValtheraCompatible,
    collection: string
): Promise<Record<string, any>> {
    const sampleDoc = await db.findOne({ collection, search: {} });
    if (!sampleDoc) return {};
    return sampleDoc;
}

function buildFieldTree(sampleDoc: Record<string, any>): TreeNode[] {
    return Object.entries(sampleDoc).map(([key, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            return {
                name: key,
                children: buildFieldTree(value),
            };
        }
        return { name: key };
    });
}

export async function buildTree(): Promise<TreeNode[]> {
    const tree: TreeNode[] = [];

    for (const [dbName, dbConfig] of Object.entries(config.dbsList)) {
        const db = ValtheraAutoRemoteCreate(dbConfig);
        const collections = await fetchCollections(db);

        const dbNode: TreeNode = {
            name: dbName,
            children: [],
        };

        for (const collection of collections) {
            const fields = await inferFields(db, collection);
            const collectionNode: TreeNode = {
                name: collection,
                children: buildFieldTree(fields),
            };
            dbNode.children?.push(collectionNode);
        }

        tree.push(dbNode);
    }

    return tree;
}
