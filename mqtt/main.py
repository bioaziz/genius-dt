import time
import network
import ujson
from machine import Pin, I2C
import dht
from umqtt.simple import MQTTClient
from MPU6050 import MPU6050

# -------- CONFIGURATION --------
#WIFI_SSID = "HIH-Dorm"
#WIFI_SSID = "KIC_LOCAL_G"
WIFI_SSID = "Buffalo-A-B8E8"
#WIFI_PASSWORD = "Welcome.hih123"
WIFI_PASSWORD = "sd84hausc7bs8"
#WIFI_PASSWORD = "KICKICKICKICKIC"
MQTT_BROKER = "191.101.81.151"
MQTT_PORT = 1883
MQTT_USER = "brokerGenius"
MQTT_PASSWORD = "Genius23"
CLIENT_ID = "pico-sensor-logger"
BASE_TOPIC = "lme/sensors/environment/pico001"
MQTT_KEEPALIVE = 7200

# -------- INIT LED --------
led = Pin(15, Pin.OUT)

# -------- CONNECT TO WIFI --------
def initialize_wifi(ssid, password):
    global wlan
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if not wlan.isconnected():
        print("Connecting to Wi-Fi...")
        wlan.connect(ssid, password)

        timeout = 10
        while timeout > 0 and not wlan.isconnected():
            print("Connecting to Wi-Fi...")
            time.sleep(1)
            timeout -= 1

    if wlan.isconnected():
        print("✅ WiFi connected. IP:", wlan.ifconfig()[0])
        return True
    else:
        print("❌ WiFi connection failed")
        return False

# Initialize global wlan object
wlan = None

# Try to connect to WiFi
if not initialize_wifi(WIFI_SSID, WIFI_PASSWORD):
    print("Retrying WiFi connection in 5 seconds...")
    time.sleep(5)
    if not initialize_wifi(WIFI_SSID, WIFI_PASSWORD):
        raise RuntimeError("❌ WiFi connection failed after retry")

# -------- CONNECT TO MQTT --------
def connect_mqtt():
    global client
    max_retries = 3
    retry_count = 0

    while retry_count < max_retries:
        try:
            client = MQTTClient(
                client_id=CLIENT_ID,
                server=MQTT_BROKER,
                port=MQTT_PORT,
                user=MQTT_USER,
                password=MQTT_PASSWORD,
                keepalive=MQTT_KEEPALIVE
            )
            client.connect()
            print("✅ MQTT connected.")
            return True
        except Exception as e:
            retry_count += 1
            print(f"❌ MQTT connection failed (attempt {retry_count}/{max_retries}):", e)
            if retry_count < max_retries:
                wait_time = 3 * retry_count  # Increasing backoff
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print("Max retries reached. Will try again in main loop.")
                return False

# Initialize global client object
client = None

# Try to connect to MQTT
if not connect_mqtt():
    print("MQTT connection will be retried in the main loop.")

# -------- INIT SENSORS --------
dht_sensor = dht.DHT11(Pin(6))  # GPIO6
i2c = I2C(0, scl=Pin(5), sda=Pin(4), freq=100000)
mpu = MPU6050(i2c)
mpu.wake()

# -------- PUBLISH FUNCTION --------
def safe_publish(topic, payload):
    global client
    max_retries = 2
    retry_count = 0

    while retry_count <= max_retries:
        try:
            if client is None:
                raise Exception("MQTT client not initialized")

            client.publish(topic, payload, qos=1)
            print("📤 Published to", topic, ":", payload)
            return True
        except Exception as e:
            retry_count += 1
            print(f"❌ MQTT publish failed (attempt {retry_count}/{max_retries}):", e)

            # Try to clean up and reconnect
            try:
                if client is not None:
                    client.disconnect()
            except:
                pass

            # Attempt to reconnect
            if retry_count <= max_retries:
                print("Attempting to reconnect to MQTT...")
                if connect_mqtt():
                    print("Reconnected to MQTT, retrying publish...")
                else:
                    print("Failed to reconnect to MQTT")
            else:
                print("Max retries reached for publishing. Message may be lost.")
                return False

    return False

# -------- CHECK CONNECTIONS --------
def check_connections():
    # Check WiFi
    if not wlan.isconnected():
        print("WiFi disconnected. Attempting to reconnect...")
        if not initialize_wifi(WIFI_SSID, WIFI_PASSWORD):
            print("Failed to reconnect to WiFi. Will retry later.")
            return False

    # Check MQTT
    if client is None:
        print("MQTT client not initialized. Attempting to connect...")
        if not connect_mqtt():
            print("Failed to connect to MQTT. Will retry later.")
            return False

    return True

# -------- LOOP --------
while True:
    try:
        # Check connections before proceeding
        if not check_connections():
            print("Connection issues detected. Waiting before retry...")
            led.off()
            time.sleep(5)
            continue

        led.on()

        # Format timestamp in ISO
        dt = time.localtime()
        iso_time = "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}".format(*dt[:6])
        print("🕒 Logging at", iso_time)

        # DHT11 Reading
        try:
            dht_sensor.measure()
            temp = dht_sensor.temperature()
            hum = dht_sensor.humidity()
            print("🌡️ Temp:", temp, "°C  💧 Humidity:", hum, "%")
        except Exception as e:
            print("❌ DHT11 read failed:", e)
            temp = None
            hum = None

        # MPU6050 Reading
        try:
            x, y, z = mpu.read_accel_data()
            print("📈 Acceleration - X:", x, " Y:", y, " Z:", z)
        except Exception as e:
            print("❌ MPU6050 read failed:", e)
            x = y = z = None

        # Prepare sensor data with metadata
        temp_data = {
            "timestamp": iso_time,
            "value": temp,
            "unit": "celsius",
            "sensor_type": "DHT11",
            "sensor_id": "pico001-temp"
        }

        hum_data = {
            "timestamp": iso_time,
            "value": hum,
            "unit": "percent",
            "sensor_type": "DHT11",
            "sensor_id": "pico001-hum"
        }

        accel_data_x = {
            "timestamp": iso_time,
            "value": x,
            "unit": "g",
            "sensor_type": "MPU6050",
            "sensor_id": "pico001-accel",
            "axis": "x"
        }

        accel_data_y = {
            "timestamp": iso_time,
            "value": y,
            "unit": "g",
            "sensor_type": "MPU6050",
            "sensor_id": "pico001-accel",
            "axis": "y"
        }

        accel_data_z = {
            "timestamp": iso_time,
            "value": z,
            "unit": "g",
            "sensor_type": "MPU6050",
            "sensor_id": "pico001-accel",
            "axis": "z"
        }

        # Publish
        safe_publish(f"{BASE_TOPIC}/temperature", ujson.dumps(temp_data))
        safe_publish(f"{BASE_TOPIC}/humidity", ujson.dumps(hum_data))
        safe_publish(f"{BASE_TOPIC}/accel/x", ujson.dumps(accel_data_x))
        safe_publish(f"{BASE_TOPIC}/accel/y", ujson.dumps(accel_data_y))
        safe_publish(f"{BASE_TOPIC}/accel/z", ujson.dumps(accel_data_z))

        led.off()
        time.sleep(2)

    except Exception as e:
        print("❌ Error in main loop:", e)
        led.off()
        time.sleep(5)
