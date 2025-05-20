import eventBus from "./../../modules/Events"; // ✅ Import event system
import { Sensor, Channel, Samples, SensorID, ChannelID, HistoricalDataView } from "./HistoricalDataView";

class SensorDataManager implements HistoricalDataView {
    private sensors: Map<SensorID, Sensor> = new Map();
    private channels: Map<ChannelID, Channel> = new Map();
    private sensorSamples: Map<SensorID, Map<ChannelID, Samples>> = new Map();
    private updateInterval: NodeJS.Timeout | null = null;
    private lastEmittedTime: Date = new Date(); // ✅ Track last emitted time

    constructor() {
        this.init();
    }

    // ✅ Initialize Sensor Data
    private init() {
        this._initializeSensors();
        this._initializeChannels();
        this.startDataUpdates();
    }

    // ✅ Generate Sensors for Stators (24 stators)
    private _initializeSensors() {
        for (let i = 1; i <= 24; i++) {
            const sensorId: SensorID = `sensor_${i}`;
            this.sensors.set(sensorId, {
                name: `Sensor ${i}`,
                groupName: `Stator ${i}`,
                location: { x: 0, y: 2 + i * 0.895, z: 0 }, // Adjust height per stator
                objectId: 1000 + i, // Example object ID
            });

            this.sensorSamples.set(sensorId, new Map());
            this.sensorSamples.get(sensorId)!.set("temperature", { count: 0, timestamps: [], values: [] });
        }
    }

    // ✅ Initialize Sensor Channels
    private _initializeChannels() {
        this.channels.set("temperature", {
            name: "Temperature",
            type: "double",
            unit: "°C",
            min: 10,  // Adjusted to real-world range
            max: 40,
        });
    }

    // ✅ Start Real-Time Data Updates
    private startDataUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            const now = new Date();
            const MAX_DATA_POINTS = 20;
            let updatedSensors: Record<SensorID, number> = {};

            // ✅ Function to Update Sensor Samples
            const updateSamples = (sensorId: SensorID, channelId: ChannelID, newValue: number) => {
                const sensorChannelSamples = this.sensorSamples.get(sensorId)?.get(channelId);
                if (!sensorChannelSamples) return;

                sensorChannelSamples.timestamps.push(now);
                sensorChannelSamples.values.push(newValue);
                sensorChannelSamples.count++;

                // ✅ Maintain only the last 20 data points
                if (sensorChannelSamples.timestamps.length > MAX_DATA_POINTS) {
                    sensorChannelSamples.timestamps.shift();
                    sensorChannelSamples.values.shift();
                }

                updatedSensors[sensorId] = newValue; // ✅ Store updated values for UI
            };

            // ✅ Update each stator sensor temperature
            for (let i = 1; i <= 24; i++) {
                const temperature = 20 + Math.random() * 10; // ✅ Range: 10-40°C
                updateSamples(`sensor_${i}`, "temperature", temperature);
            }

            // ✅ Ensure `timeUpdate` is emitted **every second**
            const timeSinceLastEmit = now.getTime() - this.lastEmittedTime.getTime();
            if (timeSinceLastEmit >= 1000) {
                eventBus.emit("timeUpdate", now);
                this.lastEmittedTime = now; // ✅ Track last emitted time
                console.log("⏰ timeUpdate emitted:", now.toLocaleTimeString());
            }

            // ✅ Emit sensor updates
            eventBus.emit("sensorUpdated", updatedSensors);
        }, 1000);
    }

    // ✅ Get Sensors
    public getSensors(): Readonly<Map<SensorID, Sensor>> {
        return this.sensors;
    }

    // ✅ Get Channels
    public getChannels(): Readonly<Map<ChannelID, Channel>> {
        return this.channels;
    }

    // ✅ Get Time Range
    public getTimerange(): [Date, Date] {
        const timestamps = [...this.sensorSamples.values()]
            .flatMap((sensorMap) => [...sensorMap.values()])
            .flatMap((samples) => samples.timestamps);
        return timestamps.length > 0 ? [timestamps[0], timestamps[timestamps.length - 1]] : [new Date(), new Date()];
    }

    // ✅ Get Sensor Data Samples
    public getSamples(sensorId: SensorID, channelId: ChannelID): Readonly<Samples> | undefined {

        return this.sensorSamples.get(sensorId)?.get(channelId);
    }

    // ✅ Stop Data Updates
    public stopUpdates(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// ✅ Export Singleton Instance
const sensorDataManager = new SensorDataManager();
export function getSensorData(): HistoricalDataView {
    return sensorDataManager;
}
