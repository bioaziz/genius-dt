# Data Integration Approaches Comparison

| Aspect | Mock Data Integration | Real-Time Sensor Integration |
|--------|----------------------|------------------------------|
| **Development Phase** | Initial prototyping | Operational deployment |
| **Data Sources** | - Simulated vibration data<br>- Simulated temperature/humidity<br>- Simulated acoustic signals | - ADXL343 & MPU6050 (position/acceleration)<br>- DHT11 (temperature/humidity) |
| **Hardware Requirements** | Minimal (development machine only) | - Raspberry Pico W microcontrollers<br>- Raspberry Pi 4 (MQTT broker)<br>- Physical sensors |
| **Data Characteristics** | - Predefined patterns<br>- Simulated normal and fault conditions<br>- Controlled test scenarios | - Actual environmental readings<br>- Real-world noise and variations<br>- Unpredictable patterns |
| **MQTT Topics** | Identical to planned real sensor topics | Production topic structure (e.g., lme/vibration, lme/temperature) |
| **Key Benefits** | - Early validation of visualization pipeline<br>- Testing of UI elements without hardware<br>- Performance benchmarking<br>- Rapid iteration | - Authentic data patterns<br>- True environmental response<br>- Production-ready system<br>- Real-world validation |
| **Implementation Approach** | Dedicated mock data generator | Incremental transition from mock to live sources |
| **Transition Strategy** | → | - Switch individual sensor topics<br>- Validate against expected patterns<br>- Update UI components |