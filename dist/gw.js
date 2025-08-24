export function createGwValidFn(gw) {
    return async (path, perm, user) => {
        return gw.hasAccess(user.id, path, perm);
    };
}
