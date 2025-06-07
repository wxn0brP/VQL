export function deepMerge<T = Record<string, any>>(target: T, source: T): T {
    if (typeof target !== 'object' || target === null) {
        target = {} as T;
    }

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                if (!target[key]) {
                    target[key] = {} as any;
                }
                deepMerge(target[key], source[key]);
            } else if (Array.isArray(source[key])) {
                if (!Array.isArray(target[key])) {
                    target[key] = [] as any;
                }
                target[key] = (target[key] as any).concat(source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}