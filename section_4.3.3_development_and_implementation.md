# 4.3.3 Development and Implementation

This section details the development and implementation of the Genius-DT platform, focusing on the technical aspects of creating a Digital Twin for Linear Motor Elevators using mock data. The implementation follows a modular, extensible architecture with a strong focus on real-time visualization and interaction.

## Development Environment Setup

### Vite and TypeScript Configuration

The project uses Vite as the build tool, providing fast development server startup and hot module replacement. The configuration in `vite.config.ts` sets up path aliases, TailwindCSS integration, and build optimization:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // Use root path for Vercel, or '/genius-dt/' for GitHub Pages
  base: process.env.DEPLOY_TARGET === 'gh-pages' ? '/genius-dt/' : '/',
  plugins: [
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 10000, // Increased from default 500
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src')
    }
  }
})
```

TypeScript is configured with strict type checking and modern ECMAScript features, ensuring type safety throughout the application:

```typescript
// tsconfig.json (partial)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Three.js Integration

The core 3D rendering functionality is implemented in the `GeniusWorld` class, which encapsulates Three.js setup and provides a high-level API for the rest of the application:

```typescript
// GeniusWorld.ts (constructor)
constructor(element: HTMLElement) {
    this.element = element;

    // Renderer
    this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    this.renderer.setSize(element.clientWidth, element.clientHeight);
    element.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new Scene();
    this.scene.background = new Color("#aaaaaa");

    // Camera
    this.camera = new PerspectiveCamera(75, element.clientWidth / element.clientHeight, 0.1, 100000);
    this.camera.position.z = 5;

    // Add light
    this.addLights();

    // Raycaster
    this.raycaster = new GeniusRaycaster(this.camera, this.element);

    // OrbitControls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
}
```

The rendering loop is implemented with `requestAnimationFrame` to ensure smooth animation and updates:

```typescript
// GeniusWorld.ts (render method)
public render(): void {
    const rendering = () => {
        requestAnimationFrame(rendering);
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
    };
    rendering();
}
```

## 3D Model Integration

### GLTF Model Loading

The platform loads 3D models using Three.js's GLTFLoader, with error handling, progress tracking, and automatic registration of objects for raycasting:

```typescript
// GeniusWorld.ts (LoadGLTF method)
public async LoadGLTF(fileURL: string): Promise<Object3D> {
    if (!fileURL) {
        throw new Error("Invalid file URL");
    }

    return new Promise((resolve, reject) => {
        const gltfLoader = new GLTFLoader();
        const loadingTimeout = setTimeout(() => {
            reject(new Error('GLTF loading timed out.'));
        }, 10000);

        this.emitter.emit("loading-start");

        gltfLoader.load(
            fileURL,
            (gltf) => {
                clearTimeout(loadingTimeout);
                this.scene.add(gltf.scene);
                this.raycastObjects.push(gltf.scene);
                this.raycaster.setObjects(this.raycastObjects);

                // Register objects inside GeniusWorld
                gltf.scene.traverse((child) => {
                    if (child instanceof Object3D) {
                        child.updateMatrixWorld(true); // Force update world positions
                        this.raycastObjects.push(child);
                        const wrappedObject = new Object3DWrap(child);
                        this.object3DWrapMap.set(child.uuid, wrappedObject);
                        this.object3DWrapNameMap.set(child.name, wrappedObject);
                    }
                });

                this.raycaster.setObjects(this.raycastObjects);
                eventBus.emit("modelLoaded", gltf.scene);
                this.emitter.emit("loading-complete", gltf.scene);
                resolve(gltf.scene);
            },
            (progress) => {
                this.emitter.emit("loading-progress", progress.loaded / progress.total);
            },
            (error) => {
                clearTimeout(loadingTimeout);
                this.emitter.emit("loading-error", error);
                reject(error);
            }
        );
    });
}
```

### Object Identification and Classification

The platform identifies and classifies objects in the 3D model based on naming patterns. For example, the `SensorSpritesExtension` identifies stators to place sensor sprites:

```typescript
// SensorSpritesExtension.ts (init method)
async init(): Promise<void> {
    super.init();
    this.dataView = getSensorData();

    // Wait for Stator Positions to be Extracted
    console.log("⏳ Waiting for stator positions...");
    // Ensure StatorManager receives an array
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

    // Add sensor sprites after extracting positions
    this.addSensorSprites(statorPositions);
}
```

## Mock Data Simulation System

### Data Generation Strategy

The `SensorDataManager` class implements mock data generation for temperature sensors using `setInterval` to create periodic updates:

```typescript
// sensorUtils.ts (startDataUpdates method)
private startDataUpdates() {
    if (this.updateInterval) {
        clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
        const now = new Date();
        const MAX_DATA_POINTS = 20;
        let updatedSensors: Record<SensorID, number> = {};

        // Function to Update Sensor Samples
        const updateSamples = (sensorId: SensorID, channelId: ChannelID, newValue: number) => {
            const sensorChannelSamples = this.sensorSamples.get(sensorId)?.get(channelId);
            if (!sensorChannelSamples) return;

            sensorChannelSamples.timestamps.push(now);
            sensorChannelSamples.values.push(newValue);
            sensorChannelSamples.count++;

            // Maintain only the last 20 data points
            if (sensorChannelSamples.timestamps.length > MAX_DATA_POINTS) {
                sensorChannelSamples.timestamps.shift();
                sensorChannelSamples.values.shift();
            }

            updatedSensors[sensorId] = newValue; // Store updated values for UI
        };

        // Update each stator sensor temperature
        for (let i = 1; i <= 24; i++) {
            const temperature = 20 + Math.random() * 10; // Range: 20-30°C
            updateSamples(`sensor_${i}`, "temperature", temperature);
        }

        // Emit sensor updates
        eventBus.emit("sensorUpdated", updatedSensors);
    }, 1000);
}
```

### Sensor Types and Parameters

The system defines sensor types and parameters with configurable ranges and units:

```typescript
// sensorUtils.ts (_initializeChannels method)
private _initializeChannels() {
    this.channels.set("temperature", {
        name: "Temperature",
        type: "double",
        unit: "°C",
        min: 10,  // Adjusted to real-world range
        max: 40,
    });
}
```

### Historical Data Management

The system maintains historical data using a sliding window approach with a configurable maximum number of data points:

```typescript
// sensorUtils.ts (updateSamples function)
const updateSamples = (sensorId: SensorID, channelId: ChannelID, newValue: number) => {
    const sensorChannelSamples = this.sensorSamples.get(sensorId)?.get(channelId);
    if (!sensorChannelSamples) return;

    sensorChannelSamples.timestamps.push(now);
    sensorChannelSamples.values.push(newValue);
    sensorChannelSamples.count++;

    // Maintain only the last 20 data points
    if (sensorChannelSamples.timestamps.length > MAX_DATA_POINTS) {
        sensorChannelSamples.timestamps.shift();
        sensorChannelSamples.values.shift();
    }

    updatedSensors[sensorId] = newValue; // Store updated values for UI
};
```

## Event-Driven Architecture

### EventBus Implementation

The platform uses the `mitt` library to implement a centralized event bus for communication between decoupled components:

```typescript
// Events.ts
import mitt, {Emitter} from "mitt";
import {Object3D, Vector3} from "three";
import {SensorID, ChannelID} from "./../Extensions/Sensors/HistoricalDataView";

// Define event types
type Events = {
    select: Object3D[];
    deselect: void;
    hover: Object3D;
    unhover: Object3D | void;
    timeUpdate: Date;
    sensorSelected: SensorID;
    sensorHovered: SensorID;
    sensorUpdated: Record<SensorID, number>;
    heatmapUpdate: { channel: ChannelID; timestamp: Date };
    modelLoaded: Object3D;
    statorPositionsReady: Vector3[];
};

// Create a shared event emitter
const eventBus: Emitter<Events> = mitt<Events>();

export default eventBus;
```

### Key Events

Components communicate through events for various interactions and updates:

```typescript
// GeniusWorld.ts (constructor)
eventBus.on("select", (object: Object3D[]) => console.log("Object selected:", object));
eventBus.on("hover", (object) => console.log("Hovered over:", object.name));
eventBus.on("deselect", () => console.log("Deselected object."));
eventBus.on("unhover", () => console.log("Unhovered all."));

// SensorSpritesExtension.ts (init method)
eventBus.on("hover", (hoveredObject) => this.onSpriteHovered(hoveredObject));
eventBus.on("unhover", (hoveredObject) => this.onSpriteUnhovered(hoveredObject));
eventBus.on("select", (selectedObjects) => {
    if (!selectedObjects[0]) return;
    this.onSpriteClicked(selectedObjects[0]);
});
eventBus.on("sensorSelected", (sensorId: SensorID) => {
    console.log(`📌 Highlighting Sensor Sprite: ${sensorId}`);
    // Find the corresponding sprite and highlight it
});
```

## Extension System

### Base Extension Class

The platform uses an extension system to add functionality in a modular way. The `SensorExtension` class serves as the base class for all sensor extensions:

```typescript
// SensorExtension.ts
export default class SensorExtension {
    protected world: GeniusWorld;
    protected scene: Scene;
    protected active: boolean = false;

    constructor(world: GeniusWorld) {
        this.world = world;
        this.scene = world.scene;
    }

    // Initialize the sensor extension (Called once)
    init(): void {
        this.world.addExtension(this);
        this.active = true;
        console.log(`${this.constructor.name} initialized.`);
    }

    // Update data (Runs every frame if needed)
    update(): void {
        if (!this.active) return;
        // Example: Refresh sensor data
    }

    // Activate (Enables extension if disabled)
    activate(): void {
        this.active = true;
        console.log(`${this.constructor.name} activated.`);
    }

    // Deactivate (Disables without disposing)
    deactivate(): void {
        this.active = false;
        console.log(`${this.constructor.name} deactivated.`);
    }

    // Dispose (Removes from GeniusWorld)
    dispose(): void {
        this.deactivate();
        this.world.removeExtension(this);
        console.log(`${this.constructor.name} disposed.`);
    }
}
```

### Specialized Extensions

Specialized extensions extend the base class to provide specific functionality. For example, the `SensorSpritesExtension` visualizes sensors as sprites in the 3D scene:

```typescript
// SensorSpritesExtension.ts (addSensorSprites method)
private addSensorSprites(statorPositions: Vector3[]): void {
    console.log("🚀 Adding Sensor Sprites...");

    // Load texture
    const texture = new TextureLoader().load(this.spriteTextureUrl);

    statorPositions.forEach((position, index) => {
        const sensorId = `sensor_${index + 1}`;

        if (this.sensorSprites.has(sensorId)) return; // Prevent duplicates

        // Create sprite material
        const material = new SpriteMaterial({map: texture, depthTest: false, transparent: true});
        const sprite = new Sprite(material);
        sprite.scale.set(0.3, 0.2, 0.3); // Adjust size for visibility

        // Place sprite at stator position (Offset slightly upward)
        sprite.position.copy(position).add(new Vector3(0.1, 0.5, 0));

        sprite.name = sensorId; // Assign sensor ID

        this.scene.add(sprite);
        this.sensorSprites.set(sensorId, sprite); // Store in map

        this.world.raycastObjects.push(sprite); // Add sprite to raycast list

        console.log(`✅ Sensor Sprite Created: ${sensorId} at (${sprite.position.x}, ${sprite.position.y}, ${sprite.position.z})`);
    });

    // Ensure Raycaster Detects Sprites
    this.world.raycaster.setObjects(this.world.raycastObjects);
    console.log("🎯 Sensor Sprites Added Successfully.");
}
```

## Advanced Visualization Components

### Heatmap Implementation

The platform implements a heatmap visualization for temperature data using the `SensorHeatmapExtension` class, which colors stator objects based on sensor readings:

```typescript
// SensorHeatmapExtension.ts (applyHeatmap method)
public applyHeatmap(): void {
    if (!this.dataView) return;
    if (!this.heatmapEnabled) return; // Prevent applying if disabled

    console.log(`🔥 Applying Heatmap for Channel: ${this.selectedChannel}`);

    for (let i = 1; i <= 24; i++) {
        const sensorId: SensorID = `sensor_${i}`;
        const statorObject = this.world.getObject3DWrapByFullName(`stator_${i}`);
        if (!statorObject) {
            console.warn(`⚠️ Stator ${i} not found.`);
            continue;
        }

        const samples = this.dataView.getSamples(sensorId, this.selectedChannel);
        if (!samples || samples.values.length === 0) {
            console.warn(`⚠️ No data for ${sensorId}.`);
            continue;
        }

        const latestValue = samples.values[samples.values.length - 1]; // Get latest sensor value
        const heatmapColor = this.getColorFromValue(latestValue);

        statorObject.object3D.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                const material = child.material as THREE.MeshStandardMaterial;
                material.color.set(heatmapColor); // Directly set color
                material.needsUpdate = true;
            }
        });
    }

    console.log(`✅ Heatmap Applied for ${this.selectedChannel} at ${this.currentTime.toLocaleTimeString()}`);
}
```

The heatmap uses a color scale to represent temperature values, with blue for cold, green for moderate, yellow for warm, and red for hot:

```typescript
// SensorHeatmapExtension.ts (getColorFromValue method)
private getColorFromValue(value: number): string {
    if (value <= 20) return "#0000FF"; // Blue (Cold)
    if (value <= 23) return "#00FF00"; // Green (Moderate)
    if (value <= 24) return "#FFFF00"; // Yellow (Warm)
    return "#FF0000"; // Red (Hot)
}
```

### Mover Implementation

The platform implements mover (elevator car) animation using the `MoverPositionExtension` class, which provides smooth transitions between floors:

```typescript
// MoverPositionExtension.ts (moveMover method)
private moveMover(targetPosition: number) {
    if (!this.moverGroup) {
        console.warn("⚠️ Mover Group not initialized!");
        return;
    }

    console.log(`🚀 Moving mover to floor Y position: ${targetPosition}`);

    const speed = 2; // Speed in units per second
    const startPosition = this.currentPosition;
    const distance = Math.abs(targetPosition - startPosition);
    const duration = (distance / speed) * 1000; // Convert to milliseconds

    console.log(`⏳ Move Duration: ${duration.toFixed(2)}ms for distance ${distance.toFixed(2)}`);

    const startTime = performance.now();

    const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1); // Normalize progress (0 to 1)

        if (this.moverGroup) {
            this.moverGroup.position.y = startPosition + (targetPosition - startPosition) * progress;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            this.currentPosition = targetPosition;
            console.log("✅ Mover reached the designated floor.");

            // Play Beep Sound
            if (this.beepSound) {
                this.beepSound.play();
                console.log("🔊 Beep Sound Played!");
            }
        }
    };

    requestAnimationFrame(animate);
}
```

The extension also includes audio feedback when the mover reaches its destination:

```typescript
// MoverPositionExtension.ts (loadBeepSound method)
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
```

### Object Wrapper Implementation

The platform uses an object wrapper (`Object3DWrap`) to extend Three.js Object3D functionality with animation and movement tracking:

```typescript
// Object3DWrapper.ts (move method)
move (moveInfo: IMoveInfo): void {
    // Arrays are already initialized in property declarations
    if (moveInfo.repeatable !== true && this.checkMoveName(moveInfo)) {
        console.log(`${this.fullName} move ${moveInfo.name} is non repeatable, so don't move repeatedly.`)
        return
    }
    this.cancelMove()
    const oldPosition = this.object3D.position.clone()
    const oldRotation = this.object3D.rotation.clone()
    const oldLocation = {
        position: oldPosition,
        rotation: oldRotation
    }
    this.beforeMoveLocation.push(oldLocation)
    this.moveHistoryList.push(moveInfo)

    const endPositionX: number = moveInfo?.position?.x === undefined ? oldPosition.x : oldPosition.x + moveInfo.position.x
    const endPositionY: number = moveInfo?.position?.y === undefined ? oldPosition.y : oldPosition.y + moveInfo.position.y
    const endPositionZ: number = moveInfo?.position?.z === undefined ? oldPosition.z : oldPosition.z + moveInfo.position.z

    const endRotationX: number = moveInfo?.rotation?.x === undefined ? oldRotation.x : oldRotation.x + degToRad(moveInfo.rotation.x)
    const endRotationY: number = moveInfo?.rotation?.y === undefined ? oldRotation.y : oldRotation.y + degToRad(moveInfo.rotation.y)
    const endRotationZ: number = moveInfo?.rotation?.z === undefined ? oldRotation.z : oldRotation.z + degToRad(moveInfo.rotation.z)

    const endPosition = new Vector3(endPositionX, endPositionY, endPositionZ)
    const endRotation = new Euler(endRotationX, endRotationY, endRotationZ)
    const endLocation = {
        position: endPosition,
        rotation: endRotation
    }
    const startLocation = {
        position: oldLocation.position.clone(),
        rotation: oldLocation.rotation.clone()
    }
    this.moveAction(startLocation, endLocation, moveInfo?.duration === undefined ? 1000 : moveInfo.duration)
}
```

The wrapper uses tweens for smooth animations:

```typescript
// Object3DWrapper.ts (moveAction method)
moveAction (startLocation: ILocationInfo, endLocation: ILocationInfo, duration: number): void {
    this.moveTween = new Tween(startLocation)
        .to(endLocation, duration)
        .easing(Easing.Quadratic.Out)
        .onUpdate(() => {
            const position = startLocation.position
            const rotation = startLocation.rotation
            this.object3D.position.set(position.x, position.y, position.z)
            this.object3D.rotation.set(rotation.x, rotation.y, rotation.z)
        })
        .onStop(() => {
            this.moveTween = null
        })
        .onComplete(() => {
            this.moveTween = null
        })
        .start()

    const animate = (time: DOMHighResTimeStamp): void => {
        if (this.moveTween !== null) {
            requestAnimationFrame(animate)
            this.moveTween.update(time)
        }
    }
    animate(0)
}
```

### Raycaster Implementation

The platform implements interactive object selection and hovering using the `GeniusRaycaster` class:

```typescript
// GeniusRaycaster.ts (getIntersectedObject method)
private getIntersectedObject(event: MouseEvent, container: HTMLElement): Object3D | null {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects: Intersection<Object3D>[] = this.raycaster.intersectObjects(this.objects, true);

    if (intersects.length > 0) {
        console.log("🎯 Raycaster Hit:", intersects[0].object.type, intersects[0].object);
        return intersects[0].object;
    }

    return null;
}
```

The raycaster handles both mesh and sprite objects, applying different visual effects for each:

```typescript
// GeniusRaycaster.ts (onHover method)
private onHover(event: MouseEvent, container: HTMLElement): void {
    const intersectedObject = this.getIntersectedObject(event, container);
    console.log("🔍 Hovered Object Type:", intersectedObject?.type, intersectedObject);

    if (!intersectedObject) {
        this.onMouseLeave();
        return;
    }

    if (this.selectedObjects.has(intersectedObject)) {
        return;
    }

    if (this.hoveredObject && !this.selectedObjects.has(this.hoveredObject)) {
        if (this.hoveredObject instanceof Mesh) {
            this.hoveredObject.material = this.hoveredObject.userData.originalMaterial;
        } else if (this.hoveredObject instanceof Sprite) {
            const spriteMaterial = this.hoveredObject.material as SpriteMaterial;
            spriteMaterial.opacity = 1.0; // Restore opacity for sprites
        }
    }

    if (intersectedObject instanceof Mesh) {
        intersectedObject.userData.originalMaterial = intersectedObject.material;
        intersectedObject.material = this.highlightMaterial;
    } else if (intersectedObject instanceof Sprite) {
        const spriteMaterial = intersectedObject.material as SpriteMaterial;
        spriteMaterial.opacity = 0.5; // Make sprite slightly transparent on hover
    }

    this.hoveredObject = intersectedObject;

    eventBus.emit("hover", intersectedObject);
}
```

## User Interface Components

### Sensor Visualization Techniques

The platform uses sprite-based visualization for sensors, with dynamic scaling and opacity for interactive feedback:

```typescript
// SensorSpritesExtension.ts (onSpriteHovered method)
private onSpriteHovered(object: any): void {
    if (object instanceof Sprite) {
        console.log(`🟢 Sensor Hovered: ${object.name}`);

        // Adjust opacity for highlight effect
        const spriteMaterial = object.material as SpriteMaterial;
        spriteMaterial.opacity = 0.7;

        eventBus.emit("sensorHovered", object.name);
    }
}
```

### Interactive Elements

The platform implements interactive elements like hover and selection effects, with camera transitions to focus on selected components:

```typescript
// SensorSpritesExtension.ts (onSpriteClicked method)
private onSpriteClicked(object: any): void {
    const sensorId = [...this.sensorSprites.entries()].find(([_id, sprite]) => sprite.uuid === object.uuid)?.[0];

    if (sensorId) {
        console.log(`🟠 Sensor Clicked: ${sensorId}`);
        eventBus.emit("sensorSelected", sensorId);

        // Scale up clicked sprite
        this.resetAllSpriteScales(); // Reset all first
        const sprite = this.sensorSprites.get(sensorId);
        if (sprite) {
            sprite.scale.set(0.5, 0.5, 0.5); // Make it bigger
            console.log(`📏 Sensor ${sensorId} Scaled Up.`);

            // Move & zoom camera to sensor position
            const targetPosition = sprite.position.clone().add(new Vector3(0, 2, 5)); // Offset slightly
            this.world.camera.position.lerp(targetPosition, 0.8); // Smooth transition
            this.world.camera.lookAt(sprite.position); // Look directly at sensor
        }
    }
}
```

### Control Panels and Dashboards

The platform implements UI panels for displaying sensor information, with real-time updates based on data changes:

```typescript
// SensorListPanel.ts
export default class SensorListPanel extends UIBasePanel {
    private dataView: HistoricalDataView | null = null;

    constructor() {
        super("sensor-list-panel", "📋 Sensor List", 600, 300);

        console.log("📌 SensorListPanel Constructor Called...");
        this.dataView = getSensorData();

        // Initialize Table with Columns
        this.initializeTable([
            {title: "Sensor_id", field: "id"},
            {title: "Sensor", field: "sensor"},
            {title: "Group", field: "group"},
        ]);
        this.initializeOutsideClickListener();
        // Populate Initial Data
        this.populateTable(this.getSensorData());
    }

    private getSensorData() {
        if (!this.dataView) return [];

        const rows = [];
        for (const [sensorId, sensor] of this.dataView.getSensors().entries()) {
            console.log(`📋 Adding Sensor: ${sensorId}, Group: ${sensor.groupName}`);
            rows.push({
                id: sensorId,
                sensor: sensor.name,
                group: sensor.groupName,
            });
        }
        return rows;
    }

    // Override Row Click Logic
    protected onRowClicked(row: HTMLTableRowElement) {
        const sensorId = row.dataset.sensorId;
        if (!sensorId) return;
        console.log(`📌 Sensor Selected from Table: ${sensorId}`);
        super.onRowClicked(row);
        eventBus.emit("sensorSelected", sensorId);
    }
}
```

## Conclusion

The development and implementation of the Genius-DT platform demonstrates a modular, extensible architecture with a strong focus on real-time visualization and interaction. The use of modern web technologies like Three.js, TypeScript, and Vite enables efficient development and a responsive user experience. The event-driven architecture and extension system provide flexibility for future enhancements and integration with real sensor data.
