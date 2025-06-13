export function deepMerge(target, source) {
    if (typeof target !== 'object' || target === null) {
        target = {};
    }
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                if (!target[key]) {
                    target[key] = {};
                }
                deepMerge(target[key], source[key]);
            }
            else if (Array.isArray(source[key])) {
                if (!Array.isArray(target[key])) {
                    target[key] = [];
                }
                target[key] = target[key].concat(source[key]);
            }
            else {
                target[key] = source[key];
            }
        }
    }
    return target;
}
