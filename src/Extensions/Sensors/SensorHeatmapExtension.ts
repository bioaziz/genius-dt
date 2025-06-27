import SensorExtension from "./SensorExtension";
import SensorHeatmapsPanel from "./SensorHeatmapsPanel";
import eventBus from "./../../modules/Events";
import { getSensorData } from "./sensorUtils";
import { HistoricalDataView, SensorID, ChannelID } from "./HistoricalDataView";
import * as THREE from "three"; // ✅ Ensure Three.js is imported

export default class SensorHeatmapExtension extends SensorExtension {
    private panel: SensorHeatmapsPanel | null = null;
    private dataView: HistoricalDataView | null = null;
    private currentTime: Date = new Date();
    private selectedChannel: ChannelID = "temperature";
    private heatmapEnabled: boolean = false; // ✅ Toggle heatmap visibility

    init(): void {
        super.init();
        this.panel = new SensorHeatmapsPanel();
        this.world.addPanel("sensor-heatmap", this.panel);
        this.dataView = getSensorData();

        // ✅ Listen for time updates
        eventBus.on("timeUpdate", (time: Date) => {
            this.currentTime = time;
            if (this.heatmapEnabled) this.applyHeatmap();
        });

        // ✅ Listen for channel selection
        if (this.panel) {
            this.panel.onChannelChanged = (channelId: ChannelID) => {
                this.selectedChannel = channelId;
                if (this.heatmapEnabled) this.applyHeatmap();
            };
        }
    }

    // ✅ Apply Heatmap dynamically (No need to store colors)
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
                    material.color.set(heatmapColor); // ✅ Directly set color
                    material.needsUpdate = true;
                }
            });
        }

        console.log(`✅ Heatmap Applied for ${this.selectedChannel} at ${this.currentTime.toLocaleTimeString()}`);
    }

    // ✅ Clears heatmap by resetting objects to white
    public clearHeatmap(): void {
        for (let i = 1; i <= 24; i++) {
            const statorObject = this.world.getObject3DWrapByFullName(`stator_${i}`);
            if (!statorObject) continue;

            statorObject.object3D.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    material.color.set("#FFFFFF"); // ✅ Reset to default color
                    material.needsUpdate = true;
                }
            });
        }

        console.log("🧊 Heatmap Cleared");
    }

    // ✅ Converts sensor values to heatmap colors (Previous HEX version)
    private getColorFromValue(value: number): string {
        if (value <= 20) return "#0000FF"; // Blue (Cold)
        if (value <= 23) return "#00FF00"; // Green (Moderate)
        if (value <= 24) return "#FFFF00"; // Yellow (Warm)
        return "#FF0000"; // Red (Hot)
    }

    // ✅ Toggle heatmap visibility
    public toggleHeatmap(isActive: boolean): void {
        console.log(`🔥 Toggling Heatmap - isActive: ${isActive}`);
        this.heatmapEnabled = isActive; // ✅ Set state from UI button

        if (this.heatmapEnabled) {
            console.log("🔥 Applying Heatmap...");
            this.applyHeatmap();
        } else {
            console.log("🧊 Clearing Heatmap...");
            this.clearHeatmap();
        }

        console.log(`🔥 Heatmap ${this.heatmapEnabled ? "Enabled" : "Disabled"}`);
    }
}
