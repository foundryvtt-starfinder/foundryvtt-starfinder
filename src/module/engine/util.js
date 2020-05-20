export function raise(message) {
    throw new Error(message);
}

export function nowOrThen(p, block) {
    if (p && p.then) {
        return p.then(block);
    } else {
        return block(p);
    }
}