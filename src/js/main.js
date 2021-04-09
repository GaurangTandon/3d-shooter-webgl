import { Game } from "./game.js";

let fired = false;

function domLoaded() {
    if (document.readyState === "complete") {
        if (!fired) {
            fired = true;
            const g = new Game("gamecanvas");
            g.start();
        }
    }
}

document.addEventListener("readystatechange", domLoaded);
domLoaded();
