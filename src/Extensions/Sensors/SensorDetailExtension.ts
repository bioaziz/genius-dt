import SensorExtension from "./SensorExtension";
import SensorDetailPanel from "./SensorDetailPanel";
import eventBus from "./../../modules/Events";
import {getSensorData} from "./sensorUtils";
import {HistoricalDataView, SensorID} from "./HistoricalDataView";

export default class SensorDetailExtension extends SensorExtension {
    private panel: SensorDetailPanel | null = null;
    private currentSensorID: SensorID | null = null;
    private dataView: HistoricalDataView | null = null;

    private handleTimeUpdate = () => this.updateCursor();
    private handleSensorSelected = (sensorId: SensorID) => {
        console.log("🔍 Sensor Selected:", sensorId);

        if (!this.dataView) {
            console.warn("⚠️ No dataView available!");
            return;
        }

        if (!this.dataView.getSensors().has(sensorId)) {
            console.warn(`⚠️ Sensor ${sensorId} not found in dataView`);
            return;
        }

        this.currentSensorID = sensorId;
        this.updateCharts();
    };

    private handleDeselected = () => {
        this.currentSensorID = null;
        this.panel?.clear();
    };

    init(): void {
        super.init();
        this.panel = new SensorDetailPanel();
        this.world.addPanel("sensor-detail", this.panel);

        // ✅ Fetch sensor data
        this.dataView = getSensorData();

        // ✅ Event listeners
        eventBus.on("timeUpdate", this.handleTimeUpdate);
        eventBus.on("sensorSelected", this.handleSensorSelected);
        eventBus.on("deselect", this.handleDeselected);

        console.log("📋 Sensor Detail Extension Initialized.");
    }

    private updateCharts(): void {
        if (!this.currentSensorID || !this.panel || !this.dataView) return;

        const sensor = this.dataView.getSensors().get(this.currentSensorID);
        if (!sensor) {
            console.warn(`⚠️ Sensor ${this.currentSensorID} not found.`);
            return;
        }

        console.log(`📡 Updating Charts for Sensor: ${sensor.name}`);

        const channels = this.dataView.getChannels();
        if (!channels || channels.size === 0) {
            console.warn(`⚠️ No channels available for sensor: ${this.currentSensorID}`);
            return;
        }

        const chartData: { name: string; timestamps: Date[]; values: number[] }[] = [];

        // Always include GAPDH data (Temperature in this case) for continuity
        for (const [channelId, channel] of channels.entries()) {
            // Get data for the current sensor
            const samples = this.dataView.getSamples(this.currentSensorID, channelId);
            if (samples) {
                chartData.push({
                    name: channel.name,
                    timestamps: samples.timestamps,
                    values: samples.values,
                });
            } else {
                console.warn(`⚠️ No sample data for sensor: ${this.currentSensorID}, Channel: ${channelId}`);
            }
        }

        if (chartData.length === 0) {
            console.warn(`⚠️ No valid channels with data found for sensor: ${this.currentSensorID}`);
            return;
        }

        // Update charts without recreating them
        this.panel.updateCharts(sensor.name, chartData);
    }

    private updateCursor(): void {
        if (!this.currentSensorID || !this.panel || !this.dataView) return;

        console.log(`🔄 Auto-updating cursor for Sensor: ${this.currentSensorID}`);

        // Update cursor for current sensor to maintain continuous data flow
        this.panel.updateCursor(this.currentSensorID, this.dataView);
    }

    dispose(): void {
        super.dispose();
        if (this.panel) {
            this.world.removePanel("sensor-detail");
            this.panel = null;
        }

        eventBus.off("timeUpdate", this.handleTimeUpdate);
        eventBus.off("sensorSelected", this.handleSensorSelected);
        eventBus.off("deselect", this.handleDeselected);
    }
}
