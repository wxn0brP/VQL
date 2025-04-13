import { fetchTreeData } from "./fetch";
import { treeContainer } from "./html";
import { renderAcl } from "./render";

function renderTree(container: HTMLElement, nodes: TreeNode[], path: string[] = []) {
    if (path.length < 2) {
        nodes.forEach((node) => {
            const details = document.createElement("details");
            const summary = document.createElement("summary");
            summary.textContent = (path.length === 0 ? "🧰" : "📁" ) + " " + node.name;

            const currentPath = [...path, node.name];

            summary.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNodeClick(currentPath)
            });

            details.appendChild(summary);

            if (node.children && node.children.length > 0) {
                renderTree(details, node.children, currentPath);
            }

            container.appendChild(details);
        });
    } else {
        const ul = document.createElement("ul");

        nodes.forEach((node) => {
            const li = document.createElement("li");
            li.textContent = node.name;

            const currentPath = [...path, node.name];

            li.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNodeClick(currentPath)
            });

            if (node.children && node.children.length > 0) {
                renderTree(li, node.children, currentPath);
            }

            ul.appendChild(li);
        });

        container.appendChild(ul);
    }
}

async function handleNodeClick(path: string[]) {
    const entityId = JSON.stringify(path);
    renderAcl(entityId);
}

try {
    const treeData = await fetchTreeData();
    renderTree(treeContainer, treeData);
} catch (error) {
    console.error("Error loading tree data:", error);
    treeContainer.textContent = "Failed to load tree data.";
}

document.querySelector<HTMLInputElement>("#hidePath").addEventListener("change", (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    fetch(`/hidePath?hidePath=${checked}`);
});
document.querySelector<HTMLInputElement>("#hidePath").checked = true;