import SensorExtension from "./SensorExtension";
import SensorListPanel from "./SensorListPanel";

export default class SensorListExtension extends SensorExtension {
    private panel: SensorListPanel | null = null;

    init(): void {
        super.init(); // ✅ Registers itself with GeniusWorld

        this.panel = new SensorListPanel();
        this.world.addPanel("sensor-list", this.panel); // ✅ Add panel to GeniusWorld

        console.log("📋 Sensor List Extension Initialized.");
    }

    dispose(): void {
        super.dispose();

        if (this.panel) {
            this.world.removePanel("sensor-list"); // ✅ Remove panel properly
            this.panel = null;
        }
    }
}
