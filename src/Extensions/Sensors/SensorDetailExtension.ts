import SensorExtension from "./SensorExtension";
import SensorDetailPanel from "./SensorDetailPanel";
import eventBus from "./../../modules/Events";
import {getSensorData} from "./sensorUtils";
import {HistoricalDataView, SensorID} from "./HistoricalDataView";

export default class SensorDetailExtension extends SensorExtension {
    private panel: SensorDetailPanel | null = null;
    private currentSensorID: SensorID | null = null;
    private dataView: HistoricalDataView | null = null;

    init(): void {
        super.init();
        this.panel = new SensorDetailPanel();
        this.world.addPanel("sensor-detail", this.panel);

        // ✅ Fetch sensor data
        this.dataView = getSensorData();

        // ✅ Update charts every second
        eventBus.on("timeUpdate", () => {
            this.updateCursor();
        });

        // ✅ Update when selecting a sensor
        eventBus.on("sensorSelected", (sensorId: SensorID) => {
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
        });

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
        console.log(`📡 Checking Available Channels for Sensor: ${this.currentSensorID}`);
       console.log("📡 All Channels (Array):", [...this.dataView.getChannels().keys()]);
        console.log(`📡 Samples:`, this.dataView.getSamples(this.currentSensorID!, "temperature"));


        const channels = this.dataView.getChannels();
      if (!channels || channels.size === 0) {
            console.warn(`⚠️ No channels available for sensor: ${this.currentSensorID}`);
            return;
        }

        const chartData: { name: string; timestamps: Date[]; values: number[] }[] = [];

        for (const [channelId, channel] of channels.entries()) {
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

        this.panel.updateCharts(sensor.name, chartData);
    }

    private updateCursor(): void {
        if (!this.currentSensorID || !this.panel || !this.dataView) return;

        console.log(`🔄 Auto-updating cursor for Sensor: ${this.currentSensorID}`);

        this.panel.updateCursor(this.currentSensorID, this.dataView);
    }

    dispose(): void {
        super.dispose();
        if (this.panel) {
            this.world.removePanel("sensor-detail");
            this.panel = null;
        }

        eventBus.off("timeUpdate", this.updateCursor);
        eventBus.off("sensorSelected", this.updateCharts);
    }
}
