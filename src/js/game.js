import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import * as THREE from "../build/three.module.js";
import { Vector3 } from "../build/three.module.js";
import { OrbitControls } from "./jsm/controls/OrbitControls.js";
import { Airplane } from "./airplane.js";

// Game is taking place in XY plane
// Camera is along origin in Z axis

const CAMERA_Z = 2,
    SCALE = 1 / 10;

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

function pathToGLTF(gltfFileName) {
    return `../../assets/gltf/${gltfFileName}`;
}

class Game {
    canvas;

    renderer;

    camera;

    scene;

    previousTime = 0;

    pressedKeys = [];

    player;

    width;

    height;

    static BULLET_TYPE = "bullet";

    updateCameraProps() {
        this.camera.left = -1;
        this.camera.right = 1;
        this.camera.top = 1;
        this.camera.bottom = -1;
        this.camera.near = -1;
        this.camera.far = 2;
        this.camera.zoom = 1;
        this.camera.position.set(0, 0, 1);
    }

    update(deltaTime) {
        if (resizeRendererToDisplaySize(this.renderer)) {
            this.updateCameraProps();
            this.camera.updateProjectionMatrix();
        }

        if (this.player) {
            // move environment down by fixed speed
            if (this.player.fire()) {
                this.loadModel(Airplane.BULLET_GLTF, Game.BULLET_TYPE);
            }

            const bulletVelocity = deltaTime * 0.001;
            this.player.updateBullets(bulletVelocity);
        }
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
                this.player.displace(disp.multiplyScalar(velocityScaling));
            }
        }

        if (!playerMoved) {
            // TOOD: enable slowmo
        }
    }

    /**
     * main render loop of our thing
     */
    render(_time) {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * @param name {String}
     */
    loadModel(name, type, callback) {
        const loader = new GLTFLoader(),
            path = pathToGLTF(name);

        loader.load(path, (gltf) => {
            const root = gltf.scene;
            this.scene.add(root);
            root.scale.setScalar(SCALE);

            if (type === Game.BULLET_TYPE) {
                this.player.addBullet(root);
            }

            if (callback) {
                callback(root);
            }
        });
    }

    setup() {
        this.previousTime = Date.now();
        this.resetKeys();

        this.scene.background = new THREE.Color(0x00AAAA);

        this.loadModel("airplane.glb", "player", (model) => {
            this.player = new Airplane(model);
            model.rotation.x = 90;
        });
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
        this.canvas.addEventListener("keydown", this.keyPressed.bind(this));

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });

        this.scene = new THREE.Scene();

        {
            this.camera = new THREE.OrthographicCamera();
            this.updateCameraProps();
            const controls = new OrbitControls(this.camera, this.canvas);
            controls.target.set(0, 0, 0);
            controls.update();
        }

        {
            const color = 0xFFFFFF,
                intensity = 1,
                light = new THREE.DirectionalLight(color, intensity);

            light.position.set(0, 0, CAMERA_Z);
            this.scene.add(light);
            this.scene.add(light.target);
        }
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
