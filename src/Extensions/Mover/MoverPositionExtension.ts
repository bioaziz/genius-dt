import SensorExtension from "./../Sensors/SensorExtension";
import MoverPositionPanel from "./MoverPositionPanel";
import MoverManager from "./../../modules/MoverManager";
import * as THREE from "three";
import {Object3D} from "three";
import GeniusWorld from "../../modules/GeniusWorld.ts";

export default class MoverPositionExtension extends SensorExtension {
    private panel: MoverPositionPanel | null = null;
    private moverGroup: THREE.Group | null = null;
    private currentPosition: number = 0;
    private audioLoader: THREE.AudioLoader;
    private beepSound: THREE.Audio | null = null;

    constructor(world: GeniusWorld) {
        super(world);
        this.audioLoader = new THREE.AudioLoader();
    }

    init(): void {
        super.init();
        this.panel = new MoverPositionPanel();
        this.world.addPanel("mover-position", this.panel);

        // ✅ Get movers and guide shoes from MoverManager
        const moverObjects = MoverManager.moverObjects;
        const guideShoes = MoverManager.guideShoeObjects;
        this.moverGroup = this.groupMoverElements(moverObjects, guideShoes);

        // ✅ Load Beep Sound
        this.loadBeepSound();

        // ✅ Listen for Position Changes
        if (this.panel) {
            this.panel.onPositionSet = (targetPosition: number) => {
                this.moveMover(targetPosition);
            };
        }
    }

    // ✅ Group movers and guide shoes together
    private groupMoverElements(moverObjects: Object3D[], guideShoes: Object3D[]): THREE.Group | null {
        const moverGroup = new THREE.Group();

        moverObjects.forEach((mover) => moverGroup.add(mover));
        guideShoes.forEach((shoe) => moverGroup.add(shoe));

        if (moverGroup.children.length > 0) {
            this.world.scene.add(moverGroup);
            console.log("✅ Mover Group Created with Guide Shoes:", moverGroup);
            return moverGroup;
        } else {
            console.warn("⚠️ No mover elements or guide shoes found!");
            return null;
        }
    }


    private moveMover(targetPosition: number) {
        if (!this.moverGroup) {
            console.warn("⚠️ Mover Group not initialized!");
            return;
        }

        console.log(`🚀 Moving mover to floor Y position: ${targetPosition}`);

        const speed = 2; // ✅ Speed in units per second
        const startPosition = this.currentPosition;
        const distance = Math.abs(targetPosition - startPosition);
        const duration = (distance / speed) * 1000; // ✅ Convert to milliseconds

        console.log(`⏳ Move Duration: ${duration.toFixed(2)}ms for distance ${distance.toFixed(2)}`);

        const startTime = performance.now();

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1); // ✅ Normalize progress (0 to 1)

            if (this.moverGroup) {
                this.moverGroup.position.y = startPosition + (targetPosition - startPosition) * progress;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.currentPosition = targetPosition;
                console.log("✅ Mover reached the designated floor.");

                // ✅ Play Beep Sound
                if (this.beepSound) {
                    this.beepSound.play();
                    console.log("🔊 Beep Sound Played!");
                }
            }
        };

            requestAnimationFrame(animate);
        }

    private loadBeepSound() {
        if (!this.world) return;

        const listener = new THREE.AudioListener();
        this.world.camera.add(listener);

        this.beepSound = new THREE.Audio(listener);

        this.audioLoader.load("./sounds/elevator-ding-at-arenco-tower-dubai-38520.mp3", (buffer) => {
            this.beepSound!.setBuffer(buffer);
            this.beepSound!.setLoop(false);
            this.beepSound!.setVolume(1);
            console.log("✅ Beep Sound Loaded Successfully!");
        });
    }


}
