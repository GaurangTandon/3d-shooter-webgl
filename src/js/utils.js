// only works for ASCII
function isPressed(keys, key) {
    return keys[key.charCodeAt(0)];
}

const PLAYER_Z = 1;

function randomChoose(lst) {
    return lst[Math.floor(Math.random() * lst.length)];
}

export { isPressed, PLAYER_Z, randomChoose };
