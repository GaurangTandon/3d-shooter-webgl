// only works for ASCII
function isPressed(keys, key) {
    return keys[key.charCodeAt(0)];
}

export { isPressed };
