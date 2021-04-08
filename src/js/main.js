import {Game} from './scene.js';

let fired = false;

function domLoaded() {
    if (document.readyState !== "complete") return true;
    if (fired) return;

    fired = true;
    const g = new Game("gamecanvas");
    g.start();
}


document.addEventListener("readystatechange", domLoaded);
domLoaded();