
# Guide for Setting Up MQTT with Mosquitto and Node-RED for Temperature Sensor Data

This guide will walk you through setting up an MQTT broker with Mosquitto on your VPS server, structuring topics for temperature sensor data from the LME system, and configuring Node-RED for data processing.

## 1. Setting Up Mosquitto MQTT Broker on VPS

### Install Mosquitto
```bash
# Update package lists
sudo apt update

# Install Mosquitto broker and client tools
sudo apt install -y mosquitto mosquitto-clients

# Enable Mosquitto to start on boot
sudo systemctl enable mosquitto
```

### Configure Mosquitto
Create or edit the configuration file:
```bash
sudo nano /etc/mosquitto/conf.d/default.conf
```

Add the following configuration:
```
# Allow anonymous connections (for testing only)
# For production, use password authentication
listener 1883
allow_anonymous false

# Set up password file
password_file /etc/mosquitto/passwd

# Enable persistence
persistence true
persistence_location /var/lib/mosquitto/
```

### Set Up Authentication
Create a password file:
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd admin
# Enter password when prompted
```

Add additional users if needed:
```bash
sudo mosquitto_passwd /etc/mosquitto/passwd sensor_user
```

### Configure Firewall
Allow MQTT port through the firewall:
```bash
sudo ufw allow 1883
```

### Restart Mosquitto
```bash
sudo systemctl restart mosquitto
```

## 2. MQTT Topic Structure for Temperature Sensors

Design a hierarchical topic structure for your temperature sensors:

```
lme/sensors/temperature/{location}/{sensor_id}
```

Examples:
- `lme/sensors/temperature/room1/sensor001`
- `lme/sensors/temperature/machine3/sensor002`
- `lme/sensors/temperature/outdoor/sensor003`

For control commands (if needed):
```
lme/control/temperature/{location}/{sensor_id}
```

## 3. Setting Up Node-RED on VPS

### Install Node.js and npm
```bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```

### Install Node-RED
```bash
sudo npm install -g --unsafe-perm node-red
```

### Create a Systemd Service for Node-RED
Create a service file:
```bash
sudo nano /etc/systemd/system/nodered.service
```

Add the following content:
```
[Unit]
Description=Node-RED
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/usr/bin/node-red-pi
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl enable nodered
sudo systemctl start nodered
```

### Configure Firewall for Node-RED
```bash
sudo ufw allow 1880
```

## 4. Configuring Node-RED for MQTT Data Processing

1. Access Node-RED at `http://your-vps-ip:1880`

2. Install MQTT nodes (if not already installed):
   - Click the menu (top-right) > Manage palette
   - Go to the "Install" tab
   - Search for "node-red-contrib-mqtt-broker"
   - Click "Install"

3. Create a basic flow for temperature data:
   - Drag an MQTT input node to the workspace
   - Configure it with:
     - Server: `localhost:1883` (or your MQTT broker address)
     - Topic: `lme/sensors/temperature/#` (to subscribe to all temperature topics)
     - Username/Password: Use credentials created earlier
   
   - Add processing nodes as needed (function, switch, etc.)
   
   - Add output nodes (dashboard, database, etc.)

4. Example flow for temperature data processing:
   ```
   [MQTT In] → [JSON Parser] → [Function (Convert Units)] → [Switch (Threshold Check)] → [Dashboard Chart]
                                                          ↘ [Trigger Alert] (if temperature exceeds threshold)
   ```

5. Deploy your flow by clicking the "Deploy" button

## 5. Integrating LME System with MQTT

For your LME system to send temperature data to the MQTT broker:

1. Install an MQTT client library appropriate for your LME system's programming language
2. Configure the client to connect to your MQTT broker with credentials
3. Publish temperature readings to the appropriate topics
4. Example code (Python):
   ```python
   import paho.mqtt.client as mqtt
   import time
   import json
   
   # MQTT Configuration
   broker = "your-vps-ip"
   port = 1883
   username = "sensor_user"
   password = "your_password"
   
   # Connect to MQTT broker
   client = mqtt.Client()
   client.username_pw_set(username, password)
   client.connect(broker, port, 60)
   
   # Publish temperature data
   while True:
       # Get temperature from sensor (replace with actual sensor reading)
       temperature = 25.5
       
       # Create payload
       payload = json.dumps({
           "temperature": temperature,
           "unit": "celsius",
           "timestamp": time.time(),
           "sensor_id": "sensor001"
       })
       
       # Publish to topic
       client.publish("lme/sensors/temperature/room1/sensor001", payload)
       
       # Wait before next reading
       time.sleep(60)
   ```

## 6. Testing the Setup

1. Test MQTT broker with command line:
   ```bash
   # Subscribe to all temperature topics
   mosquitto_sub -h localhost -p 1883 -u admin -P your_password -t "lme/sensors/temperature/#"
   
   # Publish a test message (in another terminal)
   mosquitto_pub -h localhost -p 1883 -u admin -P your_password -t "lme/sensors/temperature/test/sensor001" -m '{"temperature": 22.5, "unit": "celsius"}'
   ```

2. Verify in Node-RED that data is flowing through your configured nodes

## 7. Security Considerations

1. Use TLS/SSL for encrypted MQTT communication:
   ```
   listener 8883
   certfile /etc/mosquitto/certs/server.crt
   keyfile /etc/mosquitto/certs/server.key
   ```

2. Implement proper authentication and access control
3. Regularly update Mosquitto and Node-RED
4. Back up your configurations and flows

## 8. Monitoring and Maintenance

1. Set up logging for Mosquitto:
   ```
   log_dest file /var/log/mosquitto/mosquitto.log
   ```

2. Monitor system resources on your VPS
3. Create regular backups of Node-RED flows:
   ```bash
   cp -r ~/.node-red /backup/location
   ```

This setup provides a solid foundation for collecting, processing, and visualizing temperature data from your LME system using MQTT and Node-RED.