// @ts-ignore
import {Sprite, SpriteMaterial, TextureLoader, Vector3, Color} from "three";
import SensorExtension from "./SensorExtension";
import {getSensorData} from "./sensorUtils";
import {HistoricalDataView, SensorID} from "./HistoricalDataView";
import eventBus from "./../../modules/Events";
import StatorManager from "@/modules/StatorPositionManager";

export default class SensorSpritesExtension extends SensorExtension {
    private sensorSprites: Map<SensorID, Sprite> = new Map();
    private spriteTextureUrl = "./sensor_icon.png";
    private dataView: HistoricalDataView | null = null;

    async init(): Promise<void> {
        super.init();
        this.dataView = getSensorData();

        // ✅ Wait for Stator Positions to be Extracted
        console.log("⏳ Waiting for stator positions...");
        // ✅ Ensure StatorManager receives an array
        const statorList = this.world.getObject3DWrapList()
            .filter(item => item.object3D.name.startsWith("stator_"))
            .map(item => item.object3D);

        if (!Array.isArray(statorList) || statorList.length === 0) {
            console.warn("⚠️ No stators found in the scene.");
            return;
        }

        const statorPositions = StatorManager.extractStatorPositions(statorList);

        if (statorPositions.length === 0) {
            console.warn("⚠️ No stator positions found. Sensor sprites will not be created.");
            return;
        }

        // ✅ Add sensor sprites after extracting positions
        this.addSensorSprites(statorPositions);

        // ✅ Listen for sensor hover
        eventBus.on("hover", (hoveredObject) => this.onSpriteHovered(hoveredObject));
        eventBus.on("unhover", (hoveredObject) => this.onSpriteUnhovered(hoveredObject));

        // ✅ Listen for sensor selection
        eventBus.on("select", (selectedObjects) => {
            if (!selectedObjects[0]) return;
            this.onSpriteClicked(selectedObjects[0]);
        });

        eventBus.on("sensorSelected", (sensorId: SensorID) => {
            console.log(`📌 Highlighting Sensor Sprite: ${sensorId}`);

            // ✅ Find the corresponding sprite
            const sprite = this.sensorSprites.get(sensorId);
            if (sprite) {
                this.resetAllSpriteScales(); // Reset previous highlights
                sprite.scale.set(0.5, 0.5, 0.5); // Scale up selected sensor

                // ✅ Move & zoom camera to sensor position
                const targetPosition = sprite.position.clone().add(new Vector3(0, 2, 5));
                this.world.camera.position.lerp(targetPosition, 0.8);
                this.world.camera.lookAt(sprite.position);
            }
        });

    }

    private onSpriteHovered(object: any): void {
        if (object instanceof Sprite) {
            console.log(`🟢 Sensor Hovered: ${object.name}`);


            // ✅ Adjust opacity for highlight effect
            const spriteMaterial = object.material as SpriteMaterial;
            spriteMaterial.opacity = 0.7;

            eventBus.emit("sensorHovered", object.name);
        }
    }

    private onSpriteUnhovered(object: any): void {
        if (object instanceof Sprite) {
            console.log(`⚪ Sensor Unhovered: ${object.name}`);


            // ✅ Restore full opacity
            const spriteMaterial = object.material as SpriteMaterial;
            spriteMaterial.opacity = 1.0;
        }
    }

    // ✅ Dynamically create sensor sprites using extracted stator positions
    private addSensorSprites(statorPositions: Vector3[]): void {
        console.log("🚀 Adding Sensor Sprites...");

        // ✅ Load texture
        const texture = new TextureLoader().load(this.spriteTextureUrl);

        statorPositions.forEach((position, index) => {
            const sensorId = `sensor_${index + 1}`;

            if (this.sensorSprites.has(sensorId)) return; // ✅ Prevent duplicates

            // ✅ Create sprite material
            const material = new SpriteMaterial({map: texture, depthTest: false, transparent: true});
            const sprite = new Sprite(material);
            sprite.scale.set(0.3, 0.2, 0.3); // ✅ Adjust size for visibility

            // ✅ Place sprite at stator position (Offset slightly upward)
            sprite.position.copy(position).add(new Vector3(0.1, 0.5, 0));

            sprite.name = sensorId; // ✅ Assign sensor ID

            this.scene.add(sprite);
            this.sensorSprites.set(sensorId, sprite); // ✅ Store in map

            this.world.raycastObjects.push(sprite); // ✅ Add sprite to raycast list

            console.log(`✅ Sensor Sprite Created: ${sensorId} at (${sprite.position.x}, ${sprite.position.y}, ${sprite.position.z})`);
        });

        // ✅ Ensure Raycaster Detects Sprites
        this.world.raycaster.setObjects(this.world.raycastObjects);
        console.log("🎯 Sensor Sprites Added Successfully.");
    }

// ✅ Handles sensor click event
    private onSpriteClicked(object: any): void {
        const sensorId = [...this.sensorSprites.entries()].find(([_id, sprite]) => sprite.uuid === object.uuid)?.[0];

        if (sensorId) {
            console.log(`🟠 Sensor Clicked: ${sensorId}`);
            eventBus.emit("sensorSelected", sensorId);

            // ✅ Scale up clicked sprite
            this.resetAllSpriteScales(); // Reset all first
            const sprite = this.sensorSprites.get(sensorId);
            if (sprite) {
                sprite.scale.set(0.5, 0.5, 0.5); // 🔍 Make it bigger
                console.log(`📏 Sensor ${sensorId} Scaled Up.`);

                // ✅ Move & zoom camera to sensor position
                const targetPosition = sprite.position.clone().add(new Vector3(0, 2, 5)); // Offset slightly
                this.world.camera.position.lerp(targetPosition, 0.8); // Smooth transition
                this.world.camera.lookAt(sprite.position); // Look directly at sensor
            }
        }
    }

// ✅ Resets all sprite sizes to default
    private resetAllSpriteScales(): void {
        this.sensorSprites.forEach(sprite => {
            sprite.scale.set(0.3, 0.3, 0.3); // ✅ Restore original size
        });
    }

    // ✅ Dynamic Updates for Moving Sensors
    update(): void {
        if (!this.active || !this.dataView) return;

        this.dataView.getSensors().forEach((sensor, sensorId) => {
            const sprite = this.sensorSprites.get(sensorId);
            if (sprite) {
                sprite.position.set(sensor.location.x, sensor.location.y + 2, sensor.location.z);
            }
        });
    }

    activate(): void {
        super.activate();
        document.addEventListener("click", this.onSpriteClicked.bind(this));
    }

    deactivate(): void {
        super.deactivate();
        document.removeEventListener("click", this.onSpriteClicked.bind(this));
    }

    dispose(): void {
        super.dispose();
        this.sensorSprites.forEach(sprite => this.scene.remove(sprite));
        this.sensorSprites.clear();
    }
}
