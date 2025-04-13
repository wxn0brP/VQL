import { showAddRuleForm } from "./addForm";
import { fetchAclRules } from "./fetch";
import { aclContainer } from "./html";
import { showRemoveRuleForm } from "./removeForm";

export async function renderAcl(entityId: string) {
    aclContainer.innerHTML = "<h2>ACL Rules for</h2><h3>" + entityId + "</h3><br>";

    const aclRules = await fetchAclRules(entityId);

    const table = document.createElement("table");
    table.innerHTML = `
        <tr>
            <th>User</th>
            <th>P</th>
            <td>READ</td>
            <td>WRITE</td>
            <td>CREATE</td>
            <td>DELETE</td>
        </tr>
    `

    aclRules.sort((a, b) => {
        if (!a.uid) return -1;
        if (!b.uid) return 1;
        return a.uid.localeCompare(b.uid)
    });

    aclRules.forEach((rule) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td onclick="removeRule('${rule.uid || ""}')">${rule.uid || ""}</td>
            <td>${rule.p}</td>
            <td>${rule.p & 1 ? "✅" : "❌"}</td>
            <td>${rule.p & 2 ? "✅" : "❌"}</td>
            <td>${rule.p & 4 ? "✅" : "❌"}</td>
            <td>${rule.p & 8 ? "✅" : "❌"}</td>
        `;
        table.appendChild(tr);
    });

    aclContainer.appendChild(table);

    const addRuleButton = document.createElement("button");
    addRuleButton.textContent = "Add Rule";
    addRuleButton.onclick = () => showAddRuleForm(entityId);
    aclContainer.appendChild(addRuleButton);

    const removeRuleButton = document.createElement("button");
    removeRuleButton.textContent = "Remove Rule";
    removeRuleButton.onclick = () => showRemoveRuleForm(entityId);
    aclContainer.appendChild(removeRuleButton);
}