import { renderAcl } from "./render";

export function showAddRuleForm(entityId: string) {
    document.querySelector("#form").innerHTML = "";
    const form = document.createElement("form");
    form.innerHTML = "<h2>Add ACL Rule</h2>";

    const userIdInput = document.createElement("input");
    userIdInput.type = "text";
    userIdInput.placeholder = "User ID";

    const permissionsDiv = document.createElement("div");
    const permissionsLabel = document.createElement("label");
    permissionsLabel.innerHTML = "Permissions:<br>";
    permissionsDiv.appendChild(permissionsLabel);

    const permFlags = [
        { name: "READ", value: 1 << 0 },
        { name: "WRITE", value: 1 << 1 },
        { name: "CREATE", value: 1 << 2 },
        { name: "DELETE", value: 1 << 3 },
    ];

    permFlags.forEach(({ name, value }) => {
        const label = document.createElement("label");
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = value.toString();
        
        label.appendChild(checkbox);
        
        label.appendChild(document.createTextNode(name));

        permissionsDiv.appendChild(label);
        permissionsDiv.appendChild(document.createElement("br"));
    });

    const permissionsInput = document.createElement("input");
    permissionsInput.type = "number";
    permissionsInput.placeholder = "Or enter permissions as a number";

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";

    form.appendChild(userIdInput);
    form.appendChild(document.createElement("br"));
    form.appendChild(permissionsDiv);
    form.appendChild(permissionsInput);
    form.appendChild(document.createElement("br"));
    form.appendChild(submitButton);

    submitButton.onclick = async (e) => {
        e.preventDefault();

        const userId = userIdInput.value;
        if (!userId) {
            const conf = confirm("Are you sure you want to add permissions to all users?");
            if (!conf) return;
        }

        let permissionsFromCheckboxes = 0;
        const box = permissionsDiv.querySelectorAll<HTMLInputElement>("input[type='checkbox']");
        permFlags.forEach(({ value }, index) => {
            const checkbox = box[index];
            console.log(checkbox);
            if (checkbox.checked) {
                permissionsFromCheckboxes |= value;
            }
        });

        const manualPermissions = parseInt(permissionsInput.value, 10);
        const permissions = isNaN(manualPermissions) ? permissionsFromCheckboxes : manualPermissions;

        if (permissions === 0) {
            alert("Please select at least one permission.");
            return;
        }

        await fetch(`/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, permissions, entityId }),
        });

        form.remove();
        renderAcl(entityId);
    };

    document.querySelector("#form").appendChild(form);
}