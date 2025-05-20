import { Scene } from "three";
import GeniusWorld from "./../../modules/GeniusWorld.ts";

export default class SensorExtension {
    protected world: GeniusWorld;
    protected scene: Scene;
    protected active: boolean = false;

    constructor(world: GeniusWorld) {
        this.world = world;
        this.scene = world.scene;
    }

    // ✅ Initialize the sensor extension (Called once)
    init(): void {
        this.world.addExtension(this);
        this.active = true;
        console.log(`${this.constructor.name} initialized.`);
    }

    // ✅ Update data (Runs every frame if needed)
    update(): void {
        if (!this.active) return;
        // Example: Refresh sensor data
    }

    // ✅ Activate (Enables extension if disabled)
    activate(): void {
        this.active = true;
        console.log(`${this.constructor.name} activated.`);
    }

    // ✅ Deactivate (Disables without disposing)
    deactivate(): void {
        this.active = false;
        console.log(`${this.constructor.name} deactivated.`);
    }

    // ✅ Dispose (Removes from GeniusWorld)
    dispose(): void {
        this.deactivate();
        this.world.removeExtension(this);
        console.log(`${this.constructor.name} disposed.`);
    }
}
