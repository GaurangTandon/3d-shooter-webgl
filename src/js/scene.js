import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import * as THREE from "../build/three.module.js";

/**
 *
 * @param renderer
 * @returns {boolean} whether renderer needs resize or not
 */
function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement,
        width = canvas.clientWidth,
        height = canvas.clientHeight,
        // SKIPS The part about HD-DPI images
        needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function createCamera() {
    // parameters are based on the view frustum
    const fov = 75,
        aspect = 2, // the canvas default
        near = 0.1,
        far = 5,

        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;

    return camera;
}

function createLighting() {
    const color = 0xFFFFFF,
        intensity = 1,
        light = new THREE.DirectionalLight(color, intensity);
    return light;
}

function pathToGLTF(gltfFileName) {
    return `../../assets/gltf/${gltfFileName}`;
}

class Game {
    canvas = document.getElementById("gamecanvas");

    renderer = new THREE.WebGLRenderer({ canvas: this.canvas });

    camera = createCamera();

    scene = new THREE.Scene();

    previousTime = 0;

    pressedKeys = [];

    update(deltaTime) {
        if (resizeRendererToDisplaySize(this.renderer)) {
            const canvas = this.renderer.domElement;
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }

        // move environment down by fixed speed
    }

    processInput() {
        const delta = {
            A: [0, -1],
            S: [-1, 0],
            D: [0, 1],
            W: [1, 0],
        };

        for (const [key, disp] of delta) {
            if (this.isPressed(key)) {
                // apply displacement to airplane
            }
        }
    }

    /**
     * main render loop of our thing
     */
    render(time) {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * @param name {String}
     */
    loadModel(name) {
        const loader = new GLTFLoader(),
            path = pathToGLTF(name);
        loader.load(path, (gltf) => {
            const root = gltf.scene;
            this.scene.add(root);
        });
    }

    setup() {
        this.scene.background = new THREE.Color(0xAAAAAA);
        this.loadModel("airplane.glb");
    }

    // only works for ASCII
    isPressed(key) {
        return this.pressedKeys[String.fromCharCode(key)];
    }

    keyPressed(event) {
        this.resetKeys();
        this.pressedKeys[event.keyCode] = true;
    }

    gameLoop() {
        const currTime = Date.now(),
            deltaTime = currTime - this.previousTime;

        this.update(deltaTime);
        this.processInput();
        this.render();

        this.previousTime = currTime;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.canvas.addEventListener("keydown", this.keyPressed.bind(this));
    }

    resetKeys() {
        this.pressedKeys = Array(256)
            .fill(false);
    }

    start() {
        this.previousTime = Date.now();
        this.resetKeys();
        this.setup();
        {
            const light = createLighting();
            light.position.set(5, 5, 2);
            this.scene.add(light);
            this.scene.add(light.target);
        }
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

export { Game };
