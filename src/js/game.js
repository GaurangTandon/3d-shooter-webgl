import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import * as THREE from "../build/three.module.js";
import { OrbitControls } from "./jsm/controls/OrbitControls.js";
import { Airplane } from "./airplane.js";
import { BackgroundFiring } from "./interval.js";
import { Background } from "./background.js";
import { EnemyManager } from "./enemyManager.js";

// Game is taking place in XY plane
// Camera is along origin in Z axis

const SCALE = 1 / 10;

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

    runTime = 0;

    enemyManager;

    update(deltaTimeActual) {
        if (resizeRendererToDisplaySize(this.renderer)) {
            this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }

        let useDeltaTime;
        {
            const slowMowDeltaTime = deltaTimeActual / 3;
            useDeltaTime = Airplane.anyMotionKeyPressed(this.pressedKeys)
                ? deltaTimeActual : slowMowDeltaTime;
        }

        if (this.player) {
            // move environment down by fixed speed
            if (this.bulletFiring.fire(this.runTime)) {
                this.loadModel(Airplane.BULLET_GLTF, Game.BULLET_TYPE);
            }

            const bulletVelocity = useDeltaTime * 0.001;
            this.player.updateBullets(bulletVelocity);
        }

        if (this.backgroundFiring.fire(this.runTime)) {
            const gltf = Background.randomGLTF();
            this.loadModel(gltf, Game.BG_TYPE);
        }

        const otherObjVelocity = useDeltaTime * 0.0005;

        this.bgManager.update(otherObjVelocity);

        const enemyObjVelocity = otherObjVelocity / 3;
        this.enemyManager.update(enemyObjVelocity);

        this.runTime += useDeltaTime;
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

            model.traverse((obj) => {
                if (obj.castShadow !== undefined) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                }
            });

            if (callback) {
                callback(model);
            }
        });
    }

    keyDown(event) {
        this.pressedKeys[event.keyCode] = true;
    }

    keyUp(event) {
        this.pressedKeys[event.keyCode] = false;
    }

    gameLoop() {
        const currTime = Date.now(),
            deltaTime = currTime - this.previousTime;

        this.update(deltaTime);
        this.processInput(deltaTime);
        this.render();

        this.previousTime = currTime;

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    addPlaneToScene() {
        const planeSize = 5,
            loader = new THREE.TextureLoader(),
            texture = loader.load("../../assets/images/water.jpg");

        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = 1; // planeSize / 2;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize),
            planeMat = new THREE.MeshPhongMaterial({
                map: texture,
                side: THREE.DoubleSide,
            }),
            mesh = new THREE.Mesh(planeGeo, planeMat);
        // mesh.rotation.x = Math.PI * -0.5;
        mesh.position.z = -0.855;
        this.scene.add(mesh);
    }

    /**
     *
     * @param name {String}
     * @param type {String}
     * @param count {Integer}
     * @param callback {Function}
     */
    loadXModels(name, type, count, callback) {
        // if (count <= 0) {
        //     callback([]);
        // }
        //
        // this.loadModel(name, type, (model) => {
        //     this.loadXModels(name, type, count - 1, (models) => {
        //         models.push(model);
        //         callback(models);
        //     });
        // });

        const models = [];
        for (let i = 0; i < count; i++) {
            this.loadModel(name, type, (model) => {
                models.push(model);

                if (models.length === count) {
                    callback(models);
                }
            });
        }
    }

    start() {
        this.previousTime = Date.now();
        this.pressedKeys = Array(256)
            .fill(false);
        this.runTime = Date.now();

        this.scene.background = new THREE.Color(0x00AAAA);

        this.backgroundFiring = new BackgroundFiring(Background.INTERVAL);
        this.bulletFiring = new BackgroundFiring(Airplane.BULLET_INTERVAL);

        this.bgManager = new Background();
        this.enemyManager = new EnemyManager();

        this.loadModel("airplane.glb", "player", (model) => {
            this.player = new Airplane(model);
            requestAnimationFrame(this.gameLoop.bind(this));
        });

        this.addPlaneToScene();

        // TODO: actually randomly spawn enemies
        this.loadXModels("enemy-jet.glb", "enemy", EnemyManager.ENEMY_PER_WAVE, (models) => {
            const objs = this.enemyManager.addEnemyChain(models);
            for (const obj of objs) {
                this.scene.add(obj);
            }
        });
    }

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.focus();
        this.canvas.addEventListener("keydown", this.keyDown.bind(this));
        this.canvas.addEventListener("keyup", this.keyUp.bind(this));

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.shadowMap.enabled = true;

        this.scene = new THREE.Scene();

        {
            const fov = 45,
                aspect = 2, // the canvas default
                near = 0.1,
                far = 100;
            this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            this.camera.position.set(0, 0, 3);
            const controls = new OrbitControls(this.camera, this.canvas);
            controls.target.set(0, 0, 0);
            controls.update();
        }

        {
            const shadowLight = new THREE.DirectionalLight(0xffffff, 1);

            shadowLight.position.set(-0.5, 0, 2);
            shadowLight.castShadow = true;

            // need to set light shadow bias and all?

            this.scene.add(shadowLight);
        }
    }
}

export { Game };
