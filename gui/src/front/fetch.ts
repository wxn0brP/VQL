export async function fetchAclRules(entityId: string): Promise<AclRule[]> {
    const response = await fetch(`/list?entityId=${encodeURIComponent(entityId)}`);
    if (!response.ok) throw new Error("Failed to fetch ACL rules");
    return await response.json();
}

export async function fetchTreeData(): Promise<TreeNode[]> {
    const response = await fetch("/tree");
    if (!response.ok) throw new Error("Failed to fetch tree data");
    return await response.json();
}
