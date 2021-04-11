import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import * as THREE from "../build/three.module.js";
import { OrbitControls } from "./jsm/controls/OrbitControls.js";
import { Airplane } from "./airplane.js";
import { BackgroundFiring } from "./interval.js";
import { Background } from "./background.js";
import { EnemyManager } from "./enemyManager.js";
import { isPressed } from "./utils.js";
import { Coins } from "./coins.js";

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

    activeScene;

    blankScene;

    previousTime = 0;

    pressedKeys = [];

    player;

    width;

    height;

    static BULLET_TYPE = "bullet";

    static BG_TYPE = "background";

    static ENEMY_TYPE = "enemy";

    static COIN_TYPE = "coin";

    backgroundFiring;

    bulletFiring;

    enemySpawnFiring;

    coinFiring;

    bgManager;

    runTime;

    startTime;

    enemyManager;

    coinManager;

    gameState;

    static GameReady = 1;

    static GameActive = 2;

    static GameOver = 3;

    elapsedSeconds() {
        return (this.runTime - this.startTime) / 1000;
    }

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

        if (this.enemySpawnFiring.fire(this.runTime)) {
            this.loadXModels("enemy-jet.glb", Game.ENEMY_TYPE, EnemyManager.ENEMY_PER_WAVE, (models) => {
                const objs = this.enemyManager.addEnemyChain(models);
                for (const obj of objs) {
                    this.activeScene.add(obj);
                }
            });
        }

        if (this.coinFiring.fire(this.runTime)) {
            this.loadModel(Coins.GLTF, Game.COIN_TYPE);
        }

        const otherObjVelocity = useDeltaTime * 0.0005;

        this.bgManager.update(otherObjVelocity);

        const enemyObjVelocity = otherObjVelocity / 3;
        this.enemyManager.update(enemyObjVelocity, this.elapsedSeconds());

        if (this.enemyManager.checkPlaneCollision(this.player.getPosition(), 0.1)) {
            this.gameFiniss();
            return;
        }

        for (const bullet of this.player.bullets) {
            if (this.enemyManager.checkBulletCollision(bullet.getPosition(), 0.1)) {
                bullet.kick();
                this.player.hitEnemy();
            }
        }

        if (this.coinManager.checkCollision(this.player.getPosition(), 0.2)) {
            this.player.hitCoin();
        }

        this.coinManager.update(enemyObjVelocity, this.elapsedSeconds());

        this.runTime += useDeltaTime;

        document.querySelector(".runtime").innerHTML = Math.floor(this.elapsedSeconds())
            .toString();
        document.querySelector(".health").innerHTML = this.player.health.toString();
        document.querySelector(".score").innerHTML = this.player.score.toString();
    }

    processInput(deltaTime) {
        this.player.processInput(deltaTime, this.pressedKeys.slice(0));
    }

    /**
     * main render loop of our thing
     */
    render(_time) {
        if (this.gameState === Game.GameActive) {
            this.renderer.render(this.activeScene, this.camera);
        } else {
            this.renderer.render(this.blankScene, this.camera);
        }
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
            this.activeScene.add(model);
            model.scale.setScalar(SCALE);

            if (type === Game.BULLET_TYPE) {
                this.player.addBullet(model);
            }

            if (type === Game.BG_TYPE) {
                this.bgManager.addBg(model);
            }

            if (type === Game.COIN_TYPE) {
                this.coinManager.addCoin(model);
            }

            if (type === Game.ENEMY_TYPE) {
                model.scale.setScalar(SCALE / 10);
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

    static toggleGameReadyText() {
        document.querySelector(".gameready")
            .classList
            .toggle("hide");
    }

    static toggleGameOverText() {
        document.querySelector(".gamelose")
            .classList
            .toggle("hide");
    }

    static toggleGameHUD() {
        document.querySelector(".score-container")
            .classList
            .toggle("hide");
    }

    gameFiniss() {
        this.gameState = Game.GameOver;
        Game.toggleGameHUD();
        Game.toggleGameOverText();
        document.querySelector(".overscore").innerHTML = this.player.score.toString();
    }

    getGameReady() {
        Game.toggleGameHUD();
        this.gameState = Game.GameActive;
        this.enemyManager.reset();
        this.coinManager.reset();
        this.player.reset();
        this.bgManager.reset();

        this.backgroundFiring.reset();
        this.bulletFiring.reset();
        this.coinFiring.reset();
        this.enemySpawnFiring.reset();

        this.previousTime = Date.now();
        this.pressedKeys = Array(256)
            .fill(false);
        this.runTime = this.startTime = Date.now();
    }

    gameLoop() {
        if (this.gameState === Game.GameActive) {
            const currTime = Date.now(),
                deltaTime = currTime - this.previousTime;

            this.update(deltaTime);
            this.processInput(deltaTime);

            this.previousTime = currTime;
        } else if (isPressed(this.pressedKeys, " ")) {
            if (this.gameState === Game.GameReady) {
                Game.toggleGameReadyText();

                this.getGameReady();
            } else {
                Game.toggleGameOverText();
                Game.toggleGameReadyText();

                this.gameState = Game.GameReady;
            }
        }

        this.render();

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

        if (mesh.castShadow !== undefined) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }

        this.activeScene.add(mesh);
    }

    /**
     *
     * @param name {String}
     * @param type {String}
     * @param count {Number}
     * @param callback {Function}
     */
    loadXModels(name, type, count, callback) {
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
        this.activeScene.background = new THREE.Color(0x00AAAA);
        this.blankScene.background = new THREE.Color(0x00AAAA);

        this.backgroundFiring = new BackgroundFiring(Background.INTERVAL);
        this.bulletFiring = new BackgroundFiring(Airplane.BULLET_INTERVAL);
        this.enemySpawnFiring = new BackgroundFiring(EnemyManager.SPAWN_INTERVAL);
        this.coinFiring = new BackgroundFiring(Coins.INTERVAL);

        this.bgManager = new Background();
        this.enemyManager = new EnemyManager();
        this.coinManager = new Coins();

        this.loadModel("airplane.glb", "player", (model) => {
            this.player = new Airplane(model);
            requestAnimationFrame(this.gameLoop.bind(this));
        });

        this.addPlaneToScene();

        Game.toggleGameReadyText();
        this.gameState = Game.GameReady;
    }

    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.focus();
        this.canvas.addEventListener("keydown", this.keyDown.bind(this));
        this.canvas.addEventListener("keyup", this.keyUp.bind(this));

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.shadowMap.enabled = true;

        this.activeScene = new THREE.Scene();

        this.blankScene = new THREE.Scene();

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
            // const shadowLight = new THREE.DirectionalLight(0xffffff, 2);
            //
            // shadowLight.position.set(-0.5, 0, 3);
            // shadowLight.castShadow = true;
            //
            // this.activeScene.add(shadowLight);
            // this.activeScene.add(shadowLight.target);

            const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9),

                ambientLight = new THREE.AmbientLight(0xdc8874, 0.5),

                shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
            shadowLight.position.set(150, 350, 350);
            shadowLight.castShadow = true;
            shadowLight.shadow.camera.left = -400;
            shadowLight.shadow.camera.right = 400;
            shadowLight.shadow.camera.top = 400;
            shadowLight.shadow.camera.bottom = -400;
            shadowLight.shadow.camera.near = 1;
            shadowLight.shadow.camera.far = 1000;
            shadowLight.shadow.mapSize.width = 4096;
            shadowLight.shadow.mapSize.height = 4096;

            this.activeScene.add(hemisphereLight);
            this.activeScene.add(shadowLight);
            this.activeScene.add(ambientLight);
        }
    }
}

export { Game };
