import mqtt from 'mqtt';
import eventBus from "../../modules/Events";

/**
 * MQTT Client for connecting to the MQTT broker and receiving sensor data
 */
export class MQTTClient {
    private client: mqtt.MqttClient | null = null;
    private connected: boolean = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private reconnectInterval: number = 5000; // 5 seconds
    private maxReconnectAttempts: number = 10;
    private reconnectAttempts: number = 0;

    // MQTT broker configuration
    // private brokerUrl: string = 'mqtt://191.101.81.151:9001';
    private brokerUrl: string = 'wss://mqtt.genius.bj';
    private options: mqtt.IClientOptions = {
        clientId: 'genius-dt-' + Math.random().toString(16).substring(2, 8),
        username: 'brokerGenius',
        password: 'Genius23',
        reconnectPeriod: 2, // We'll handle reconnection ourselves
        connectTimeout: 10000,
    };

    // Topic to subscribe to
    private topic: string = 'lme/sensors/environment/pico001/#';

    constructor() {
        console.log('🔌 MQTT Client created');
    }

    /**
     * Connect to the MQTT broker
     */
    public connect(): void {
        if (this.client) {
            console.log('🔌 MQTT Client already exists, disconnecting first');
            this.disconnect();
        }

        console.log(`🔌 Connecting to MQTT broker at ${this.brokerUrl}`);

        try {
            this.client = mqtt.connect(this.brokerUrl, this.options);

            this.client.on('connect', () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log('✅ Connected to MQTT broker');

                // Subscribe to the topic
                this.subscribe();

                // Emit event for UI updates
                eventBus.emit('mqttConnected', true);
            });

            this.client.on('error', (error) => {
                console.error('❌ MQTT connection error:', error);
                eventBus.emit('mqttError', error.message);
            });

            this.client.on('close', () => {
                this.connected = false;
                console.log('🔌 MQTT connection closed');
                eventBus.emit('mqttConnected', false);

                // Try to reconnect
                this.scheduleReconnect();
            });

            this.client.on('message', (topic, message) => {
                this.handleMessage(topic, message);
            });
        } catch (error) {
            console.error('❌ Failed to connect to MQTT broker:', error);
            eventBus.emit('mqttError', 'Failed to connect to MQTT broker');
            this.scheduleReconnect();
        }
    }

    /**
     * Disconnect from the MQTT broker
     */
    public disconnect(): void {
        if (this.client) {
            this.client.end(true);
            this.client = null;
            this.connected = false;
            console.log('🔌 Disconnected from MQTT broker');

            // Clear any reconnect timers
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
        }
    }

    /**
     * Subscribe to the MQTT topic
     */
    private subscribe(): void {
        if (!this.client || !this.connected) {
            console.error('❌ Cannot subscribe: MQTT client not connected');
            return;
        }

        this.client.subscribe(this.topic, (err) => {
            if (err) {
                console.error('❌ Failed to subscribe to topic:', err);
                eventBus.emit('mqttError', `Failed to subscribe to topic: ${this.topic}`);
            } else {
                console.log(`✅ Subscribed to topic: ${this.topic}`);
                eventBus.emit('mqttSubscribed', this.topic);
            }
        });
    }

    /**
     * Schedule a reconnection attempt
     */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectInterval * Math.min(this.reconnectAttempts, 10);

            console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

            this.reconnectTimer = setTimeout(() => {
                console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect();
            }, delay);
        } else {
            console.error(`❌ Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
            eventBus.emit('mqttError', 'Max reconnect attempts reached');
        }
    }

    /**
     * Handle incoming MQTT messages
     */
    private handleMessage(topic: string, message: Buffer): void {
        try {
            const payload = JSON.parse(message.toString());
            console.log(`📥 Received message on topic ${topic}:`, payload);

            // Extract sensor type from topic
            const topicParts = topic.split('/');
            const sensorType = topicParts[topicParts.length - 1];

            // Emit event with the sensor data
            eventBus.emit('mqttMessage', { topic, payload });

            // Also emit a specific event for this sensor type
            eventBus.emit(`mqtt${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)}`, payload);
        } catch (error) {
            console.error('❌ Error parsing MQTT message:', error);
        }
    }

    /**
     * Check if the client is connected
     */
    public isConnected(): boolean {
        return this.connected;
    }
}

// Create a singleton instance
const mqttClient = new MQTTClient();

export default mqttClient;