# 4.4 Unified Namespace Integration and Real-Time Transition

## 4.4.1 Introduction

The transition from mock data to live sensor integration represents a critical evolution in the Genius-DT digital twin platform. While mock data provides a controlled environment for development and testing, real-time sensor data enables the digital twin to accurately reflect the current state of the physical system.

The Unified Namespace (UNS) serves as the communication backbone of our system, providing a standardized way to organize and access data from various sensors and systems. By leveraging MQTT (Message Queuing Telemetry Transport) as our communication protocol, we create a lightweight, publish-subscribe network that efficiently handles real-time data streams from multiple sensors.

The primary objective of this integration is to enable live sensor streams to dynamically update the 3D visualization, creating a responsive digital twin that accurately represents the current state of the physical system. This real-time capability is essential for monitoring, diagnostics, and predictive maintenance applications.

## 4.4.2 MQTT Broker and Unified Namespace Setup

### MQTT Broker Selection and Configuration

For our implementation, we've selected Mosquitto as our MQTT broker due to its lightweight nature, reliability, and open-source availability. However, the system is designed to be compatible with any MQTT broker, including cloud-based alternatives like HiveMQ Cloud or AWS IoT Core for production environments.

Basic configuration parameters include:
- **Port**: 1883 (standard MQTT) and 9001 (MQTT over WebSockets)
- **Authentication**: Username/password authentication
- **QoS Settings**: Quality of Service level 1 (at least once delivery)
- **Persistence**: Enabled for message durability
- **Retain Messages**: Enabled for last known values

### Unified Namespace Structure

The Unified Namespace represents a structured topic tree that organizes all data channels in a hierarchical, discoverable format. This approach provides several benefits:
- **Discoverability**: New sensors and data channels can be easily discovered
- **Organization**: Logical grouping of related data
- **Filtering**: Efficient subscription to specific data subsets
- **Scalability**: Easy addition of new sensors and data types

Our UNS follows this general structure:

```
lme/
├── sensors/
│   ├── stator_<id>/
│   │   ├── temperature
│   │   └── vibration
│   ├── mover_<id>/
│   │   ├── position
│   │   └── speed
│   └── environment/
│       ├── pico001/
│       │   ├── temperature
│       │   ├── humidity
│       │   └── accel/
│       │       ├── x
│       │       ├── y
│       │       └── z
│       └── pico002/
│           └── ...
└── controls/
    └── ...
```

This structure allows clients to subscribe to specific subsets of data using wildcards. For example:
- `lme/sensors/stator_+/temperature` subscribes to temperature data from all stators
- `lme/sensors/environment/pico001/#` subscribes to all data from the pico001 environmental sensor

## 4.4.3 Replacing Mock Data with Real-Time Streams

### Strategy for Transition

The transition from mock data to real-time streams requires a careful approach to ensure system stability and backward compatibility. Our strategy involves:

1. **Abstraction Layer**: Implementing an abstraction layer in the SensorDataManager that can switch between mock data and real-time data sources
2. **Dual-Mode Operation**: Supporting both mock and real data simultaneously during the transition period
3. **Graceful Fallback**: Automatically falling back to mock data when real-time data is unavailable
4. **Progressive Replacement**: Replacing mock data sources one sensor type at a time

### Implementation in SensorDataManager

The SensorDataManager has been enhanced to support both mock data generation and MQTT subscription:

```typescript
// Simplified example of the abstraction layer
class SensorDataManager implements HistoricalDataView {
    private dataSource: 'mock' | 'mqtt' | 'dual' = 'mock';
    private mqttClient: MQTTClient | null = null;
    
    // Set the data source mode
    public setDataSource(source: 'mock' | 'mqtt' | 'dual'): void {
        this.dataSource = source;
        
        if (source === 'mock' || source === 'dual') {
            this.startMockDataUpdates();
        } else {
            this.stopMockDataUpdates();
        }
        
        if (source === 'mqtt' || source === 'dual') {
            this.connectMQTT();
        } else {
            this.disconnectMQTT();
        }
    }
    
    // Handle incoming MQTT messages
    private handleMQTTMessage(topic: string, payload: any): void {
        // Extract sensor ID and channel ID from topic
        const topicParts = topic.split('/');
        const sensorType = topicParts[2]; // e.g., 'stator', 'environment'
        const sensorId = topicParts[3];   // e.g., '1', 'pico001'
        const channelId = topicParts[4];  // e.g., 'temperature', 'humidity'
        
        // Update sensor data
        this.updateSensorData(sensorId, channelId, payload.value);
    }
}
```

### Mapping MQTT Topics to Internal Data Structures

To integrate MQTT data with our existing data structures, we map MQTT topics to sensor IDs and channel IDs:

1. Topic: `lme/sensors/stator_1/temperature`
   - Sensor ID: `sensor_1` (mapped from `stator_1`)
   - Channel ID: `temperature`

2. Topic: `lme/sensors/environment/pico001/humidity`
   - Sensor ID: `environment_pico001`
   - Channel ID: `humidity`

This mapping allows the application to maintain its existing data structure while incorporating real-time data from MQTT.

## 4.4.4 Topic Naming Conventions and Data Payload Format

### Hierarchical Topic Structure

Our topic naming convention follows a hierarchical structure aligned with UNS standards:

```
lme/sensors/<sensor_type>_<id>/<channel>
```

Examples:
- `lme/sensors/stator_3/temperature`
- `lme/sensors/environment/pico001/humidity`
- `lme/sensors/mover_2/position`

This structure provides clear organization and enables efficient filtering using MQTT wildcards.

### JSON Payload Format

All sensor data is transmitted using a consistent JSON payload format:

```json
{
  "sensorId": "stator_3",
  "channel": "temperature",
  "value": 27.8,
  "timestamp": "2025-06-27T12:31:00Z",
  "unit": "celsius",
  "sensor_type": "DHT11"
}
```

Key fields include:
- **sensorId**: Unique identifier for the sensor
- **channel**: The data channel (e.g., temperature, humidity)
- **value**: The measured value
- **timestamp**: ISO 8601 formatted timestamp
- **unit**: The unit of measurement
- **sensor_type**: The type of sensor (optional)

Additional fields may be included for specific sensor types or to provide metadata.

### Design Considerations for Extensibility

The payload format is designed for extensibility:

1. **Multiple Channels per Sensor**: A sensor can publish to multiple topics, one per channel
2. **Anomaly Flags**: Additional fields like `anomaly: true` can indicate unusual readings
3. **Metadata**: Fields like `sensor_type`, `firmware_version`, etc. provide context
4. **Quality Indicators**: Fields like `confidence` or `accuracy` can indicate data quality

## 4.4.5 Real Sensor Testing and Integration

### Hardware Setup

Our testing environment includes real sensors connected to microcontrollers that publish data to the MQTT broker:

1. **ESP32 with MQTT Client Library**:
   - MicroPython implementation
   - Connects to WiFi and MQTT broker
   - Publishes sensor data at regular intervals

2. **Sensors**:
   - **DHT11**: Temperature and humidity sensor
   - **MPU6050**: 3-axis accelerometer for vibration monitoring
   - **Additional sensors** can be added as needed

### Sensor Calibration and MQTT Publishing

The sensor code includes calibration and publishing logic:

```python
# Simplified example from mqtt/main.py
def read_and_publish_sensors():
    # Read DHT11 sensor
    dht_sensor.measure()
    temp = dht_sensor.temperature()
    hum = dht_sensor.humidity()
    
    # Read MPU6050 sensor
    x, y, z = mpu.read_accel_data()
    
    # Prepare and publish temperature data
    temp_data = {
        "timestamp": iso_time,
        "value": temp,
        "unit": "celsius",
        "sensor_type": "DHT11",
        "sensor_id": "pico001-temp"
    }
    
    # Publish to MQTT
    client.publish(f"{BASE_TOPIC}/temperature", ujson.dumps(temp_data))
```

### Example Topics and Messages

During testing, the following topics and messages are published:

1. Topic: `lme/sensors/environment/pico001/temperature`
   ```json
   {
     "timestamp": "2025-06-27T12:31:00Z",
     "value": 24.5,
     "unit": "celsius",
     "sensor_type": "DHT11",
     "sensor_id": "pico001-temp"
   }
   ```

2. Topic: `lme/sensors/environment/pico001/humidity`
   ```json
   {
     "timestamp": "2025-06-27T12:31:00Z",
     "value": 45.0,
     "unit": "percent",
     "sensor_type": "DHT11",
     "sensor_id": "pico001-hum"
   }
   ```

3. Topic: `lme/sensors/environment/pico001/accel/x`
   ```json
   {
     "timestamp": "2025-06-27T12:31:00Z",
     "value": 0.02,
     "unit": "g",
     "sensor_type": "MPU6050",
     "sensor_id": "pico001-accel",
     "axis": "x"
   }
   ```

## 4.4.6 Real-Time Behavior in the 3D Scene

### Subscribing to Topics and Updating Visualization

The 3D visualization subscribes to relevant MQTT topics through the MQTTClient and updates the scene based on incoming data:

```typescript
// Simplified example
mqttClient.connect();
eventBus.on('mqttMessage', ({ topic, payload }) => {
    // Extract sensor information from topic
    const topicParts = topic.split('/');
    const sensorType = topicParts[2];
    const sensorId = topicParts[3];
    const channelId = topicParts[4];
    
    // Update visualization based on sensor type and channel
    if (sensorType === 'stator' && channelId === 'temperature') {
        updateStatorTemperature(sensorId, payload.value);
    } else if (sensorType === 'environment') {
        updateEnvironmentSensor(sensorId, channelId, payload.value);
    }
});
```

### Real-Time Updates to Visualization Elements

The real-time data updates various visualization elements:

1. **Sensor Panels**:
   - Temperature and humidity values update in real-time
   - Historical charts show the most recent data

2. **Sprite Overlays**:
   - Color changes based on sensor values
   - Size changes to indicate importance or anomalies

3. **Heatmaps**:
   - Color gradients update to show temperature distribution
   - Intensity changes to reflect current values

4. **3D Model Elements**:
   - Component colors change based on sensor values
   - Animations reflect real-time movement or vibration

### Debugging Tools and Logging

To monitor the real-time system, several debugging tools are available:

1. **MQTT Connection Status**:
   - Visual indicator of connection state
   - Reconnection attempts logged

2. **Message Logging**:
   - Console logging of incoming messages
   - Filtering by topic or message type

3. **Performance Monitoring**:
   - Message rate tracking
   - Rendering performance metrics

4. **Data Validation**:
   - Range checking for sensor values
   - Timestamp validation for data freshness

These tools ensure the system operates correctly and help diagnose any issues that may arise during the transition to real-time data.