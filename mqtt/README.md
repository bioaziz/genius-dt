# Environment Sensor MQTT Client for Raspberry Pi Pico

This script implements an environment sensor data collection and MQTT publishing system for Raspberry Pi Pico. It collects data from DHT11 (temperature/humidity) and MPU6050 (accelerometer) sensors and publishes it to an MQTT broker.

## Features

- Connects to WiFi and MQTT broker with robust error handling and reconnection logic
- Collects temperature and humidity data from DHT11 sensor
- Collects acceleration data from MPU6050 sensor
- Publishes sensor data to MQTT topics with rich metadata
- LED indicator for operation status
- Automatic reconnection to WiFi and MQTT if connection is lost

## Hardware Requirements

- Raspberry Pi Pico W
- DHT11 temperature and humidity sensor (connected to GPIO6)
- MPU6050 accelerometer (connected via I2C: SDA=GPIO4, SCL=GPIO5)
- LED (connected to GPIO15)

## MQTT Topic Structure

The script publishes sensor data to the following topics:

- `lme/sensors/environment/pico001/temperature` - Temperature data
- `lme/sensors/environment/pico001/humidity` - Humidity data
- `lme/sensors/environment/pico001/accel/x` - X-axis acceleration data
- `lme/sensors/environment/pico001/accel/y` - Y-axis acceleration data
- `lme/sensors/environment/pico001/accel/z` - Z-axis acceleration data

## Data Format

Each message is a JSON object with the following structure:

```json
{
  "timestamp": "YYYY-MM-DD HH:MM:SS",
  "value": <sensor_value>,
  "unit": "<unit_of_measurement>",
  "sensor_type": "<sensor_type>",
  "sensor_id": "<sensor_id>",
  "axis": "<axis>"  // Only for accelerometer data
}
```

## Configuration

Edit the following variables at the top of the script to match your environment:

- `WIFI_SSID` - WiFi network name
- `WIFI_PASSWORD` - WiFi password
- `MQTT_BROKER` - MQTT broker address
- `MQTT_PORT` - MQTT broker port (default: 1883)
- `MQTT_USER` - MQTT username
- `MQTT_PASSWORD` - MQTT password
- `CLIENT_ID` - MQTT client ID
- `BASE_TOPIC` - Base MQTT topic for publishing sensor data

## Installation

1. Install MicroPython on your Raspberry Pi Pico
2. Copy the `main.py` file to the Pico
3. Install the required libraries:
   - `umqtt.simple`
   - `MPU6050`
4. Restart the Pico to run the script

## Future Enhancements

- Add support for linear motor generated stator sensor
- Implement deep sleep mode for power saving
- Add support for more sensor types
- Implement secure MQTT connection (TLS)