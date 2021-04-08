import {GLTFLoader} from './jsm/loaders/GLTFLoader.js'
import * as THREE from "../build/three.module.js";

/**
 *
 * @param renderer
 * @returns {boolean} whether renderer needs resize or not
 */
function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    // SKIPS The part about HD-DPI images
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function createCamera() {
    // parameters are based on the view frustum
    const fov = 75;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 5;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;

    return camera;
}

function pathToGLTF(gltfFileName) {
    return `../../assets/gltf/${gltfFileName}`;
}

class Game {
    canvas = document.getElementById("gamecanvas");
    renderer = new THREE.WebGLRenderer({"canvas": this.canvas});
    camera = createCamera();
    scene = new THREE.Scene();
    previousTime = 0;

    update(deltaTime) {
        if (resizeRendererToDisplaySize(this.renderer)) {
            const canvas = this.renderer.domElement;
            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }
    }

    processInput() {
        // TODO
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
        const loader = new GLTFLoader();
        const path = pathToGLTF(name);
        loader.load(path, (gltf) => {
            const root = gltf.scene;
            this.scene.add(root);
        });
    }

    setup() {
        this.scene.background = new THREE.Color(0xAAAAAA);
        this.loadModel("airplane.glb");
    }

    keyPressed(event) {
    }


    gameLoop() {
        const currTime = Date.now();
        const deltaTime = currTime - this.previousTime;

        this.update(deltaTime);
        this.processInput();
        this.render();

        this.previousTime = currTime;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.renderer = new THREE.WebGLRenderer({"canvas": this.canvas});
        this.canvas.addEventListener("keydown", this.keyPressed.bind(this));
    }

    start() {
        this.previousTime = Date.now();
        this.setup();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

export {Game};