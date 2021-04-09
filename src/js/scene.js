import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import * as THREE from "../build/three.module.js";
import { Vector3 } from "../build/three.module.js";

// Game is taking place in XY plane
// Camera is along origin in Z axis

const CAMERA_Z = 2;

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

        // TODO: change to orthographic camera
        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = CAMERA_Z;

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

    player;

    update(deltaTime) {
        if (resizeRendererToDisplaySize(this.renderer)) {
            const canvas = this.renderer.domElement;
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }

        // move environment down by fixed speed
    }

    processInput(deltaTime) {
        const delta = {
                S: new Vector3(0, -1, 0),
                A: new Vector3(-1, 0, 0),
                W: new Vector3(0, 1, 0),
                D: new Vector3(1, 0, 0),
            },
            velocityScaling = deltaTime * 0.001;

        let playerMoved = false;

        for (const [key, disp] of Object.entries(delta)) {
            if (this.isPressed(key)) {
                playerMoved = true;

                // apply displacement to airplane
                this.player.position.add(disp.multiplyScalar(velocityScaling));
            }
        }

        if (!playerMoved) {
            // TOOD: enable slowmo
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
    loadModel(name, callback) {
        const loader = new GLTFLoader(),
            path = pathToGLTF(name);
        loader.load(path, (gltf) => {
            const root = gltf.scene;
            this.scene.add(root);

            if (callback) {
                callback(root);
            }
        });
    }

    setup() {
        this.previousTime = Date.now();
        this.resetKeys();

        this.scene.background = new THREE.Color(0xAAAAAA);

        this.loadModel("airplane.glb", (model) => {
            this.player = model;
            // this.player.position = new Vector3();
            // this.player.scale = new Vector3(0.25, 0.25, 0.25);
        });

        {
            const light = createLighting();
            light.position.set(-1, 0, CAMERA_Z);
            this.scene.add(light);
            this.scene.add(light.target);
        }
    }

    // only works for ASCII
    isPressed(key) {
        return this.pressedKeys[key.charCodeAt(0)];
    }

    keyPressed(event) {
        this.pressedKeys[event.keyCode] = true;
    }

    gameLoop() {
        const currTime = Date.now(),
            deltaTime = currTime - this.previousTime;

        this.update(deltaTime);
        this.processInput(deltaTime);
        this.render();

        this.previousTime = currTime;
        this.resetKeys();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.focus();
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.canvas.addEventListener("keydown", this.keyPressed.bind(this));
    }

    resetKeys() {
        this.pressedKeys = Array(256)
            .fill(false);
    }

    start() {
        this.setup();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

export { Game };
