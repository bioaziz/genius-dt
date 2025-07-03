import SensorExtension from "./SensorExtension";
import mqttClient from "./MQTTClient";
import eventBus from "../../modules/Events";
import {Sensor, Channel, Samples, SensorID, ChannelID} from "./HistoricalDataView";
import EnvironmentSensorPanel from "./EnvironmentSensorPanel";

/**
 * Extension for displaying real-time environment sensor data from MQTT
 */
export default class EnvironmentSensorExtension extends SensorExtension {
    private panel: EnvironmentSensorPanel | null = null;
    private environmentSensors: Map<SensorID, Sensor> = new Map();
    private environmentChannels: Map<ChannelID, Channel> = new Map();
    private sensorSamples: Map<SensorID, Map<ChannelID, Samples>> = new Map();
    private MAX_DATA_POINTS = 20;

    init(): void {
        super.init(); // Register with GeniusWorld

        console.log("🌡️ Environment Sensor Extension Initializing...");

        // Initialize environment sensors
        this.initializeEnvironmentSensors();

        // Initialize environment channels
        this.initializeEnvironmentChannels();

        // Create and add the panel
        this.panel = new EnvironmentSensorPanel(this);
        this.world.addPanel("environment-sensors", this.panel);

        // Connect to MQTT broker
        mqttClient.connect();

        // Set up event listeners for MQTT messages
        this.setupEventListeners();

        console.log("🌡️ Environment Sensor Extension Initialized");
    }

    /**
     * Initialize environment sensors
     */
    private initializeEnvironmentSensors(): void {
        // Temperature sensor
        this.environmentSensors.set("pico001-temp", {
            name: "Temperature Sensor",
            description: "DHT11 temperature sensor",
            groupName: "Environment",
            location: {x: 0, y: 0, z: 0},
            objectId: 2001
        });

        // Humidity sensor
        this.environmentSensors.set("pico001-hum", {
            name: "Humidity Sensor",
            description: "DHT11 humidity sensor",
            groupName: "Environment",
            location: {x: 0, y: 0, z: 0},
            objectId: 2002
        });

        // Accelerometer sensors
        this.environmentSensors.set("pico001-accel-x", {
            name: "Accelerometer X",
            description: "MPU6050 accelerometer X-axis",
            groupName: "Environment",
            location: {x: 0, y: 0, z: 0},
            objectId: 2003
        });

        this.environmentSensors.set("pico001-accel-y", {
            name: "Accelerometer Y",
            description: "MPU6050 accelerometer Y-axis",
            groupName: "Environment",
            location: {x: 0, y: 0, z: 0},
            objectId: 2004
        });

        this.environmentSensors.set("pico001-accel-z", {
            name: "Accelerometer Z",
            description: "MPU6050 accelerometer Z-axis",
            groupName: "Environment",
            location: {x: 0, y: 0, z: 0},
            objectId: 2005
        });

        // Initialize sample storage for each sensor
        for (const sensorId of this.environmentSensors.keys()) {
            this.sensorSamples.set(sensorId, new Map());

            // Add appropriate channels for each sensor
            if (sensorId === "pico001-temp") {
                this.sensorSamples.get(sensorId)!.set("temperature", {count: 0, timestamps: [], values: []});
            } else if (sensorId === "pico001-hum") {
                this.sensorSamples.get(sensorId)!.set("humidity", {count: 0, timestamps: [], values: []});
            } else if (sensorId.startsWith("pico001-accel")) {
                this.sensorSamples.get(sensorId)!.set("acceleration", {count: 0, timestamps: [], values: []});
            }
        }
    }

    /**
     * Initialize environment channels
     */
    private initializeEnvironmentChannels(): void {
        // Temperature channel
        this.environmentChannels.set("temperature", {
            name: "Temperature",
            description: "Temperature in degrees Celsius",
            type: "double",
            unit: "°C",
            min: 0,
            max: 50
        });

        // Humidity channel
        this.environmentChannels.set("humidity", {
            name: "Humidity",
            description: "Relative humidity in percent",
            type: "double",
            unit: "%",
            min: 0,
            max: 100
        });

        // Acceleration channel
        this.environmentChannels.set("acceleration", {
            name: "Acceleration",
            description: "Acceleration in g",
            type: "double",
            unit: "g",
            min: -2,
            max: 2
        });
    }

    /**
     * Set up event listeners for MQTT messages
     */
    private setupEventListeners(): void {
        // Listen for temperature messages
        eventBus.on('mqttMessage', (data: { topic: string, payload: any }) => {
            const {topic, payload} = data;

            if (!payload || typeof payload.value !== 'number') {
                console.warn('⚠️ Invalid payload received:', payload);
                return;
            }

            // Extract sensor type from topic
            const topicParts = topic.split('/');
            const sensorType = topicParts[topicParts.length - 1];

            // Update sensor data based on topic
            if (sensorType === 'temperature') {
                this.updateSensorData("pico001-temp", "temperature", payload.value, new Date(payload.timestamp));
            } else if (sensorType === 'humidity') {
                this.updateSensorData("pico001-hum", "humidity", payload.value, new Date(payload.timestamp));
            } else if (sensorType === 'x') {
                this.updateSensorData("pico001-accel-x", "acceleration", payload.value, new Date(payload.timestamp));
            } else if (sensorType === 'y') {
                this.updateSensorData("pico001-accel-y", "acceleration", payload.value, new Date(payload.timestamp));
            } else if (sensorType === 'z') {
                this.updateSensorData("pico001-accel-z", "acceleration", payload.value, new Date(payload.timestamp));
            }
        });

        // Listen for MQTT connection status
        eventBus.on('mqttConnected', (connected: boolean) => {
            console.log(`🔌 MQTT connection status: ${connected ? 'Connected' : 'Disconnected'}`);
            if (this.panel) {
                this.panel.updateConnectionStatus(connected);
            }
        });

        // Listen for MQTT errors
        eventBus.on('mqttError', (error: string) => {
            console.error('❌ MQTT error:', error);
            if (this.panel) {
                this.panel.showError(error);
            }
        });
    }

    /**
     * Update sensor data with new value
     */
    private updateSensorData(sensorId: SensorID, channelId: ChannelID, value: number, timestamp: Date): void {
        const sensorChannelSamples = this.sensorSamples.get(sensorId)?.get(channelId);
        if (!sensorChannelSamples) {
            console.warn(`⚠️ No samples found for sensor ${sensorId}, channel ${channelId}`);
            return;
        }

        // Add new data point
        sensorChannelSamples.timestamps.push(timestamp);
        sensorChannelSamples.values.push(value);
        sensorChannelSamples.count++;

        // Maintain only the last MAX_DATA_POINTS data points
        if (sensorChannelSamples.timestamps.length > this.MAX_DATA_POINTS) {
            sensorChannelSamples.timestamps.shift();
            sensorChannelSamples.values.shift();
        }

        // Emit event for UI updates
        eventBus.emit('environmentSensorUpdated', {sensorId, channelId, value, timestamp});

        // Update the panel if it exists
        if (this.panel) {
            this.panel.updateSensorData();
        }
    }

    /**
     * Get environment sensors
     */
    public getEnvironmentSensors(): Readonly<Map<SensorID, Sensor>> {
        return this.environmentSensors;
    }

    /**
     * Get environment channels
     */
    public getEnvironmentChannels(): Readonly<Map<ChannelID, Channel>> {
        return this.environmentChannels;
    }

    /**
     * Get sensor samples
     */
    public getSensorSamples(sensorId: SensorID, channelId: ChannelID): Readonly<Samples> | undefined {
        return this.sensorSamples.get(sensorId)?.get(channelId);
    }

    /**
     * Get time range of samples
     */
    public getTimerange(): [Date, Date] {
        const timestamps = [...this.sensorSamples.values()]
            .flatMap((sensorMap) => [...sensorMap.values()])
            .flatMap((samples) => samples.timestamps);
        return timestamps.length > 0 ? [timestamps[0], timestamps[timestamps.length - 1]] : [new Date(), new Date()];
    }

    /**
     * Dispose of the extension
     */
    dispose(): void {
        // Disconnect from MQTT broker
        mqttClient.disconnect();

        // Remove the panel
        if (this.panel) {
            this.world.removePanel("environment-sensors");
            this.panel = null;
        }

        // Call parent dispose
        super.dispose();
    }

    /**
     * Update method called every frame
     */
    update(): void {
        if (!this.active) return;

        // Nothing to do here as updates come from MQTT events
    }
}