export const postBuildCommands = `rm -rf node_modules/@types/bun node_modules/bun-types && bun run types`;
export const publishToNpm = true;
export const destDir = "types";