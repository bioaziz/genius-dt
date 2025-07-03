# Real-Time Environment Sensor Data in Digital Twin

This implementation adds support for real-time environment sensor data from Raspberry Pi Pico via MQTT to the Genius-DT digital twin.

## Overview

The implementation consists of the following components:

1. **MQTT Client**: Connects to the MQTT broker and receives sensor data from the Raspberry Pi Pico
2. **Environment Sensor Extension**: Processes and manages the sensor data
3. **Environment Sensor Panel**: Displays the sensor data in the UI with real-time updates and charts

## Components

### MQTT Client

The MQTT client (`MQTTClient.ts`) connects to the MQTT broker and subscribes to the topic `lme/sensors/environment/pico001/#` to receive sensor data from the Raspberry Pi Pico. It handles connection, disconnection, and reconnection to the broker, and emits events when messages are received.

Key features:
- Automatic reconnection with exponential backoff
- Error handling
- Event-based communication with the rest of the application

### Environment Sensor Extension

The Environment Sensor Extension (`EnvironmentSensorExtension.ts`) extends the base `SensorExtension` class to handle real-time environment sensor data. It initializes environment sensors and channels, sets up event listeners for MQTT messages, and updates sensor data when new messages are received.

Key features:
- Manages environment sensors (temperature, humidity, accelerometer)
- Processes incoming MQTT messages
- Maintains historical data for each sensor
- Provides methods for accessing sensor data

### Environment Sensor Panel

The Environment Sensor Panel (`EnvironmentSensorPanel.ts`) displays the real-time environment sensor data in the UI. It shows a list of sensors with their current values, a chart for visualizing sensor data over time, and status indicators for the MQTT connection.

Key features:
- Real-time updates of sensor values
- Interactive chart for visualizing sensor data
- Connection status indicator
- Error message display

## Integration

The implementation is integrated into the main application in `main.ts`, where the Environment Sensor Extension is initialized and added to the GeniusWorld instance along with the other sensor extensions.

## Data Flow

1. The Raspberry Pi Pico collects sensor data and publishes it to the MQTT broker
2. The MQTT client in the digital twin receives the data and emits events
3. The Environment Sensor Extension processes the data and updates its internal state
4. The Environment Sensor Panel displays the data in the UI

## Sensor Types

The implementation supports the following sensor types:

- **Temperature**: DHT11 temperature sensor (°C)
- **Humidity**: DHT11 humidity sensor (%)
- **Accelerometer**: MPU6050 accelerometer (g) with X, Y, and Z axes

## MQTT Topic Structure

The implementation uses the following MQTT topic structure:

- `lme/sensors/environment/pico001/temperature`: Temperature data
- `lme/sensors/environment/pico001/humidity`: Humidity data
- `lme/sensors/environment/pico001/accel/x`: X-axis acceleration data
- `lme/sensors/environment/pico001/accel/y`: Y-axis acceleration data
- `lme/sensors/environment/pico001/accel/z`: Z-axis acceleration data

## Future Enhancements

Possible future enhancements include:

- Support for more sensor types
- 3D visualization of sensor data in the digital twin
- Historical data storage and retrieval
- Alerts and notifications for sensor values outside of normal ranges
- Integration with other systems for data analysis and visualization