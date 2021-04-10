import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import * as THREE from "../build/three.module.js";
import { Vector3 } from "../build/three.module.js";
import { OrbitControls } from "./jsm/controls/OrbitControls.js";
import { Airplane } from "./airplane.js";
import { BackgroundFiring } from "./interval.js";
import { Background } from "./background.js";

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

    static BG_TYPE = "background";

    backgroundFiring;

    bulletFiring;

    bgManager;

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
            if (this.bulletFiring.fire()) {
                this.loadModel(Airplane.BULLET_GLTF, Game.BULLET_TYPE);
            }

            const bulletVelocity = deltaTime * 0.001;
            this.player.updateBullets(bulletVelocity);
        }

        if (this.backgroundFiring.fire()) {
            const gltf = Background.randomGLTF();
            this.loadModel(gltf, Game.BG_TYPE);
        }

        this.bgManager.update(deltaTime);
    }

    processInput(deltaTime) {
        this.player.processInput(deltaTime, this.pressedKeys.slice(0));
    }

    /**
     * main render loop of our thing
     */
    render(_time) {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * @param name {String}
     * @param type {String}
     * @param [callback] {Function}
     */
    loadModel(name, type, callback) {
        const loader = new GLTFLoader(),
            path = pathToGLTF(name);

        loader.load(path, (gltf) => {
            const model = gltf.scene;
            this.scene.add(model);
            model.scale.setScalar(SCALE);

            if (type === Game.BULLET_TYPE) {
                this.player.addBullet(model);
            }

            if (type === Game.BG_TYPE) {
                this.bgManager.addBg(model);
            }

            if (callback) {
                callback(model);
            }
        });
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

    start() {
        this.previousTime = Date.now();
        this.resetKeys();

        this.scene.background = new THREE.Color(0x00AAAA);

        this.backgroundFiring = new BackgroundFiring(Background.INTERVAL);
        this.bulletFiring = new BackgroundFiring(Airplane.BULLET_INTERVAL);

        this.bgManager = new Background();

        this.loadModel("airplane.glb", "player", (model) => {
            this.player = new Airplane(model);
            requestAnimationFrame(this.gameLoop.bind(this));
        });
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
            const shadowLight = new THREE.PointLight(0xff00ff, 2);

            shadowLight.position.set(-0.5, 0, CAMERA_Z);
            shadowLight.castShadow = true;

            // const ch = new THREE.CameraHelper(shadowLight.shadow.camera);
            // scene.add(ch);

            // this.scene.add(hemisphereLight);
            this.scene.add(shadowLight);
            // this.scene.add(ambientLight);
        }
    }

    resetKeys() {
        this.pressedKeys = Array(256)
            .fill(false);
    }
}

export { Game };
