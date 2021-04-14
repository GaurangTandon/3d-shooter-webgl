import { GLTFLoader } from "./jsm/loaders/GLTFLoader.js";
import * as THREE from "../build/three.module.js";
import { Airplane } from "./airplane.js";
import { BackgroundFiring } from "./interval.js";
import { Background } from "./background.js";
import { EnemyManager } from "./enemyManager.js";
import { isPressed } from "./utils.js";
import { Coins } from "./coins.js";
import { GameObject } from "./gameobject.js";
import { Water } from "./jsm/objects/Water.js";
import { OrbitControls } from "./jsm/controls/OrbitControls.js";

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

    enemyBullets = [];

    elapsedSeconds() {
        return (this.runTime - this.startTime) / 1000;
    }

    loadMoreBullets(positionList) {
        // const targetLength = this.enemyBullets.length + positionList.length;

        for (const position of positionList) {
            this.loadModel("enemy-bullet.gltf", "enemy-bullet",
                ((positionArg) => (model) => {
                    model.position.x = positionArg.x;
                    model.position.y = positionArg.y;
                    model.position.z = positionArg.z;
                    model.rotation.x = Math.PI;
                    this.enemyBullets.push(new GameObject(model));
                })(position));
        }
    }

    update(deltaTimeActual) {
        if (resizeRendererToDisplaySize(this.renderer)) {
            this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
            this.camera.updateProjectionMatrix();
        }

        if (this.waterMesh) {
            this.waterMesh.material.uniforms.time.value += 1.0 / 60.0;
        }

        let useDeltaTime;
        {
            const slowMowDeltaTime = deltaTimeActual / 3;
            useDeltaTime = Airplane.anyMotionKeyPressed(this.pressedKeys)
                ? deltaTimeActual : slowMowDeltaTime;
        }

        // move environment down by fixed speed
        if (this.bulletFiring.fire(this.runTime)) {
            this.loadModel(Airplane.BULLET_GLTF, Game.BULLET_TYPE);
        }

        const bulletVelocity = useDeltaTime * 0.001;
        this.player.updateBullets(bulletVelocity);

        if (this.backgroundFiring.fire(this.runTime)) {
            const gltf = Background.randomGLTF();
            this.loadModel(gltf, Game.BG_TYPE);
        }

        if (this.enemySpawnFiring.fire(this.runTime)) {
            this.loadXModels("enemy-jet.gltf", Game.ENEMY_TYPE, EnemyManager.ENEMY_PER_WAVE, (models) => {
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

        const enemyObjVelocity = otherObjVelocity / 3,
            bulletsList = [];
        this.enemyManager.update(enemyObjVelocity, this.elapsedSeconds(), bulletsList);
        this.loadMoreBullets(bulletsList);

        for (const bullet of this.enemyBullets) {
            if (bullet.over) {
                continue;
            }

            const displace = new THREE.Vector3(0, -5 * enemyObjVelocity, 0);
            bullet.displace(displace);

            if (this.player.colliding(bullet.model.position, 0.1)) {
                this.player.hitBullet();
                bullet.kick();
            }

            if (!bullet.over) {
                for (const b2 of this.player.bullets) {
                    if (b2.over) {
                        continue;
                    }

                    if (b2.colliding(bullet.model.position, 0.05)) {
                        b2.kick();
                        bullet.kick();
                    }
                }
            }
        }

        if (this.enemyManager.checkPlaneCollision(this.player.getPosition(), 0.1)) {
            this.player.health = 0;
        }

        if (this.player.health <= 0) {
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
        const waterGeometry = new THREE.PlaneGeometry(7, 7);
        this.waterMesh = new Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load("../../assets/images/waternormals.jpg", function (texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x111e0f,
                distortionScale: 0.5,
            },
        );

        // this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.z = -0.855;

        if (this.waterMesh.castShadow !== undefined) {
            this.waterMesh.castShadow = true;
            this.waterMesh.receiveShadow = true;
        }

        this.activeScene.add(this.waterMesh);
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
        for (const blt of this.enemyBullets) {
            blt.kick();
        }
        this.enemyBullets = [];

        this.activeScene.background = new THREE.Color(0x00AAAA);
        this.blankScene.background = new THREE.Color(0x00AAAA);

        this.backgroundFiring = new BackgroundFiring(Background.INTERVAL);
        this.bulletFiring = new BackgroundFiring(Airplane.BULLET_INTERVAL);
        this.enemySpawnFiring = new BackgroundFiring(EnemyManager.SPAWN_INTERVAL);
        this.coinFiring = new BackgroundFiring(Coins.INTERVAL);

        this.bgManager = new Background();
        this.enemyManager = new EnemyManager();
        this.coinManager = new Coins();

        this.loadModel("airplane.gltf", "player", (model) => {
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
            this.camera.position.set(0, -1, 3);
            this.camera.rotation.x = Math.PI / 8;

            const controls = new OrbitControls(this.camera, this.canvas);
            controls.target.set(0, 0, 0);
            controls.update();
        }

        {
            const shadowLight = new THREE.DirectionalLight(0xffffff, 1),
                ambientLight = new THREE.AmbientLight(0xdc8874, 2);

            shadowLight.position.set(-0.5, 0, 3);
            shadowLight.castShadow = true;

            this.activeScene.add(shadowLight);
            this.activeScene.add(ambientLight);
        }
    }
}

export { Game };
