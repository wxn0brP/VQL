export function createGwValidFn(gw) {
    return async (args) => {
        const res = await gw.hasAccess(args.user._id, args.field, args.p);
        return { granted: res.granted, via: `gate-warden`, reason: res.via };
    };
}
