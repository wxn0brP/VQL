import { readFileSync, writeFileSync } from "node:fs";

const res = await fetch(`https://api.github.com/repos/wxn0brP/VQL`, {
    headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
    },
});

if (!res.ok) {
    throw new Error(`GitHub API request failed: ${res.status}`);
}

const { homepage } = await res.json();

if (!homepage) {
    throw new Error("Homepage is not set for repository.");
}

const url = new URL(homepage);
const escapedHomepage = url.origin + url.pathname + url.search;

const rawIndex = readFileSync(".github/index.html", "utf-8");
const index = rawIndex
    .replaceAll("$homepage", homepage)
    .replaceAll("$escapedHomepage", escapedHomepage);

writeFileSync("site/index.html", index);