export function createGwValidFn(gw) {
    return async (args) => {
        return gw.hasAccess(args.user.id, args.field, args.p);
    };
}
