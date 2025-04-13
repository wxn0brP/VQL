import { renderAcl } from "./render";

export function showRemoveRuleForm(entityId: string) {
    document.querySelector("#form").innerHTML = "";
    const form = document.createElement("form");
    form.innerHTML = "<h2>Remove ACL Rule</h2>";

    const userIdInput = document.createElement("input");
    userIdInput.type = "text";
    userIdInput.placeholder = "User ID";
    userIdInput.id = "userIdInput";

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";

    form.appendChild(userIdInput);
    form.appendChild(submitButton);

    submitButton.onclick = async (e) => {
        e.preventDefault();
        const userId = userIdInput.value;
        if (!userId) {
            const conf = confirm("Are you sure you want to remove permissions from all users?");
            if (!conf) return;
        }

        await fetch(`/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, entityId }),
        });

        form.remove();
        renderAcl(entityId);
    };

    document.querySelector("#form").appendChild(form);
}