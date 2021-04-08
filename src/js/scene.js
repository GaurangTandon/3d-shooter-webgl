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

(function main() {
    const canvas = document.getElementById("gamecanvas");
    const renderer = new THREE.WebGLRenderer({canvas});
    const camera = createCamera();
    const scene = new THREE.Scene();

    /**
     * main render loop of our thing
     * @param time milliseconds time I think
     */
    function render(time) {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            canvas.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    /**
     * @param name {String}
     */
    function loadModel(name) {
        const loader = new GLTFLoader();
        const path = pathToGLTF(name);
        loader.load(path, (gltf) => {
            const root = gltf.scene;
            scene.add(root);
        });
    }

    function setup() {
        scene.background = new THREE.Color(0xAAAAAA);
        loadModel("airplane.glb");
    }

    setup();

    requestAnimationFrame(render);
})();