interface TreeNode {
    name: string;
    children?: TreeNode[];
}

interface AclRule {
    entityId: string;
    uid: string;
    p: number;
}