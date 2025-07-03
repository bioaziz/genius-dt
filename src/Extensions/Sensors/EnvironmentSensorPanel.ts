import UIBasePanel from "../UI/Panel/UIBasePanel";
import EnvironmentSensorExtension from "./EnvironmentSensorExtension";
import eventBus from "../../modules/Events";
import { SensorID, ChannelID } from "./HistoricalDataView";
import * as echarts from 'echarts';

/**
 * Panel for displaying real-time environment sensor data
 */
export default class EnvironmentSensorPanel extends UIBasePanel {
    private extension: EnvironmentSensorExtension;
    private connectionStatusElement: HTMLDivElement | null = null;
    private errorMessageElement: HTMLDivElement | null = null;
    private sensorDataElements: Map<string, HTMLElement> = new Map();
    private selectedSensorId: SensorID | null = null;
    private chart: echarts.ECharts | null = null;

    constructor(extension: EnvironmentSensorExtension) {
        super("environment-sensor-panel", "🌡️ Environment Sensors", 700, 500);
        this.extension = extension;

        console.log("🌡️ Environment Sensor Panel Constructor Called...");

        // Create panel content
        this.createPanelContent();

        // Initialize event listeners
        this.initializeEventListeners();

        // Initial data population
        this.updateSensorData();

        // Add resize listener
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Handle window resize
     */
    private handleResize(): void {
        if (this.chart) {
            this.chart.resize();
        }
    }

    /**
     * Create the panel content
     */
    private createPanelContent(): void {
        // Create connection status element
        this.connectionStatusElement = document.createElement('div');
        this.connectionStatusElement.className = 'mqtt-connection-status';
        this.connectionStatusElement.innerHTML = '🔌 MQTT Status: Connecting...';
        this.content.appendChild(this.connectionStatusElement);

        // Create error message element
        this.errorMessageElement = document.createElement('div');
        this.errorMessageElement.className = 'mqtt-error-message';
        this.errorMessageElement.style.display = 'none';
        this.errorMessageElement.style.color = 'red';
        this.content.appendChild(this.errorMessageElement);

        // Create sensor data container
        const sensorDataContainer = document.createElement('div');
        sensorDataContainer.className = 'sensor-data-container';
        sensorDataContainer.style.display = 'flex';
        sensorDataContainer.style.marginTop = '10px';
        this.content.appendChild(sensorDataContainer);

        // Create sensor list container
        const sensorListContainer = document.createElement('div');
        sensorListContainer.className = 'sensor-list-container';
        sensorListContainer.style.flex = '1';
        sensorListContainer.style.marginRight = '10px';
        sensorDataContainer.appendChild(sensorListContainer);

        // Create sensor list title
        const sensorListTitle = document.createElement('h3');
        sensorListTitle.textContent = 'Environment Sensors';
        sensorListTitle.style.marginTop = '0';
        sensorListContainer.appendChild(sensorListTitle);

        // Create sensor list
        const sensorList = document.createElement('div');
        sensorList.className = 'sensor-list';
        sensorListContainer.appendChild(sensorList);

        // Add sensors to the list
        for (const [sensorId, sensor] of this.extension.getEnvironmentSensors().entries()) {
            const sensorElement = document.createElement('div');
            sensorElement.className = 'sensor-item';
            sensorElement.style.padding = '8px';
            sensorElement.style.margin = '4px 0';
            sensorElement.style.border = '1px solid #ddd';
            sensorElement.style.borderRadius = '4px';
            sensorElement.style.cursor = 'pointer';

            // Create sensor header with name
            const sensorHeader = document.createElement('div');
            sensorHeader.className = 'sensor-header';
            sensorHeader.style.fontWeight = 'bold';
            sensorHeader.textContent = sensor.name;
            sensorElement.appendChild(sensorHeader);

            // Create sensor value element
            const sensorValue = document.createElement('div');
            sensorValue.className = 'sensor-value';
            sensorValue.textContent = 'No data';
            sensorElement.appendChild(sensorValue);

            // Store reference to value element
            this.sensorDataElements.set(sensorId, sensorValue);

            // Add click event to select sensor
            sensorElement.addEventListener('click', () => {
                this.selectSensor(sensorId);
            });

            // Add to list
            sensorList.appendChild(sensorElement);
        }

        // Create chart container
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.style.flex = '2';
        sensorDataContainer.appendChild(chartContainer);

        // Create chart title
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = 'Sensor Data Chart';
        chartTitle.style.marginTop = '0';
        chartContainer.appendChild(chartTitle);

        // Create chart div for ECharts
        const chartDiv = document.createElement('div');
        chartDiv.style.width = '100%';
        chartDiv.style.height = '300px';
        chartContainer.appendChild(chartDiv);

        // Initialize ECharts
        this.chart = echarts.init(chartDiv);

        // Create chart message
        const chartMessage = document.createElement('div');
        chartMessage.className = 'chart-message';
        chartMessage.textContent = 'Select a sensor to view data';
        chartMessage.style.textAlign = 'center';
        chartMessage.style.marginTop = '20px';
        chartMessage.style.color = '#666';
        chartContainer.appendChild(chartMessage);
    }

    /**
     * Initialize event listeners
     */
    private initializeEventListeners(): void {
        // Listen for environment sensor updates
        eventBus.on('environmentSensorUpdated', (data: { sensorId: SensorID, channelId: ChannelID, value: number, timestamp: Date }) => {
            this.updateSensorValue(data.sensorId, data.value);

            // Update chart if this is the selected sensor
            if (this.selectedSensorId === data.sensorId) {
                this.updateChart();
            }
        });
    }

    /**
     * Update connection status
     */
    public updateConnectionStatus(connected: boolean): void {
        if (!this.connectionStatusElement) return;

        if (connected) {
            this.connectionStatusElement.innerHTML = '✅ MQTT Status: Connected';
            this.connectionStatusElement.style.color = 'green';
        } else {
            this.connectionStatusElement.innerHTML = '❌ MQTT Status: Disconnected';
            this.connectionStatusElement.style.color = 'red';
        }
    }

    /**
     * Show error message
     */
    public showError(message: string): void {
        if (!this.errorMessageElement) return;

        this.errorMessageElement.textContent = `Error: ${message}`;
        this.errorMessageElement.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            if (this.errorMessageElement) {
                this.errorMessageElement.style.display = 'none';
            }
        }, 5000);
    }

    /**
     * Update sensor data display
     */
    public updateSensorData(): void {
        // Update each sensor's value display
        for (const [sensorId] of this.extension.getEnvironmentSensors().entries()) {
            // Get the appropriate channel for this sensor
            let channelId: ChannelID;
            if (sensorId === "pico001-temp") {
                channelId = "temperature";
            } else if (sensorId === "pico001-hum") {
                channelId = "humidity";
            } else {
                channelId = "acceleration";
            }

            // Get the latest value
            const samples = this.extension.getSensorSamples(sensorId, channelId);
            if (samples && samples.values.length > 0) {
                const latestValue = samples.values[samples.values.length - 1];
                this.updateSensorValue(sensorId, latestValue);
            }
        }

        // Update chart if a sensor is selected
        if (this.selectedSensorId) {
            this.updateChart();
        }
    }

    /**
     * Update a specific sensor's value display
     */
    private updateSensorValue(sensorId: SensorID, value: number): void {
        const valueElement = this.sensorDataElements.get(sensorId);
        if (!valueElement) return;

        // Get the appropriate unit for this sensor
        let unit: string;
        if (sensorId === "pico001-temp") {
            unit = "°C";
        } else if (sensorId === "pico001-hum") {
            unit = "%";
        } else {
            unit = "g";
        }

        // Update the value display
        valueElement.textContent = `${value.toFixed(2)} ${unit}`;
    }

    /**
     * Select a sensor to display in the chart
     */
    private selectSensor(sensorId: SensorID): void {
        this.selectedSensorId = sensorId;

        // Update chart
        this.updateChart();

        // Update UI to show selected sensor
        for (const [id, element] of this.sensorDataElements.entries()) {
            const parentElement = element.parentElement;
            if (!parentElement) continue;

            if (id === sensorId) {
                parentElement.style.backgroundColor = '#f0f0f0';
                parentElement.style.borderColor = '#007bff';
            } else {
                parentElement.style.backgroundColor = '';
                parentElement.style.borderColor = '#ddd';
            }
        }
    }

    /**
     * Update the chart with the selected sensor's data
     */
    private updateChart(): void {
        if (!this.selectedSensorId || !this.chart) return;

        // Get the appropriate channel for this sensor
        let channelId: ChannelID;
        if (this.selectedSensorId === "pico001-temp") {
            channelId = "temperature";
        } else if (this.selectedSensorId === "pico001-hum") {
            channelId = "humidity";
        } else {
            channelId = "acceleration";
        }

        // Get the samples for this sensor and channel
        const samples = this.extension.getSensorSamples(this.selectedSensorId, channelId);
        if (!samples || samples.values.length === 0) return;

        // Get sensor and channel information
        const sensor = this.extension.getEnvironmentSensors().get(this.selectedSensorId);
        const channel = this.extension.getEnvironmentChannels().get(channelId);

        const sensorName = sensor ? sensor.name : this.selectedSensorId;
        const unit = channel ? channel.unit : '';

        // Format data for ECharts
        const timeData = samples.timestamps.map(time => time.toLocaleTimeString());
        const valueData = samples.values;

        // Choose appropriate chart type based on sensor type
        if (this.selectedSensorId.includes('accel')) {
            this.updateAccelerometerChart(sensorName, unit, timeData, valueData);
        } else if (this.selectedSensorId.includes('temp')) {
            this.updateTemperatureChart(sensorName, unit, timeData, valueData);
        } else if (this.selectedSensorId.includes('hum')) {
            this.updateHumidityChart(sensorName, unit, timeData, valueData);
        }
    }

    /**
     * Update temperature chart with gradient line chart
     */
    private updateTemperatureChart(sensorName: string, unit: string, timeData: string[], valueData: number[]): void {
        if (!this.chart) return;

        const option: echarts.EChartsOption = {
            title: {
                text: `${sensorName} (${unit})`,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                    const param = params[0];
                    return `${param.name}<br/>${param.value} ${unit}`;
                }
            },
            xAxis: {
                type: 'category',
                data: timeData,
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: 'value',
                name: unit,
                min: 'dataMin',
                max: 'dataMax'
            },
            series: [{
                name: sensorName,
                type: 'line',
                smooth: true,
                data: valueData,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(255, 0, 0, 0.5)' },
                        { offset: 1, color: 'rgba(0, 0, 255, 0.5)' }
                    ])
                },
                itemStyle: {
                    color: '#f00'
                }
            }]
        };

        this.chart.setOption(option);
    }

    /**
     * Update humidity chart with gauge and line chart
     */
    private updateHumidityChart(sensorName: string, unit: string, timeData: string[], valueData: number[]): void {
        if (!this.chart) return;

        const currentValue = valueData[valueData.length - 1];

        const option: echarts.EChartsOption = {
            title: {
                text: `${sensorName} (${unit})`,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            grid: {
                top: '55%',
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: timeData,
                gridIndex: 0
            },
            yAxis: {
                type: 'value',
                name: unit,
                min: 0,
                max: 100,
                gridIndex: 0
            },
            series: [
                {
                    name: 'Current Humidity',
                    type: 'gauge',
                    center: ['50%', '30%'],
                    radius: '40%',
                    min: 0,
                    max: 100,
                    itemStyle: {
                        color: '#1E90FF'
                    },
                    progress: {
                        show: true,
                        width: 18
                    },
                    pointer: {
                        show: true
                    },
                    axisLine: {
                        lineStyle: {
                            width: 18
                        }
                    },
                    axisTick: {
                        distance: -45,
                        length: 5,
                        lineStyle: {
                            width: 2,
                            color: '#999'
                        }
                    },
                    splitLine: {
                        distance: -52,
                        length: 14,
                        lineStyle: {
                            width: 3,
                            color: '#999'
                        }
                    },
                    axisLabel: {
                        distance: -20,
                        color: '#999',
                        fontSize: 12
                    },
                    detail: {
                        valueAnimation: true,
                        formatter: `{value} ${unit}`,
                        color: 'inherit'
                    },
                    data: [{
                        value: currentValue
                    }]
                },
                {
                    name: sensorName,
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: valueData,
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        width: 2,
                        color: '#1E90FF'
                    }
                }
            ]
        };

        this.chart.setOption(option);
    }

    /**
     * Update accelerometer chart with colored line chart
     */
    private updateAccelerometerChart(sensorName: string, unit: string, timeData: string[], valueData: number[]): void {
        if (!this.chart) return;

        // Determine which axis this is
        const axis = this.selectedSensorId?.split('-').pop();
        const color = axis === 'x' ? '#FF4500' : axis === 'y' ? '#32CD32' : '#1E90FF';

        const option: echarts.EChartsOption = {
            title: {
                text: `${sensorName} (${unit})`,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            xAxis: {
                type: 'category',
                data: timeData,
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: 'value',
                name: unit,
                min: -2,
                max: 2
            },
            series: [{
                name: sensorName,
                type: 'line',
                data: valueData,
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: color
                },
                symbol: 'circle',
                symbolSize: 8
            }]
        };

        this.chart.setOption(option);
    }
    /**
     * Dispose of the panel and clean up resources
     */
    dispose(): void {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize.bind(this));

        // Dispose of the chart
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }

        // Call parent dispose
        super.dispose();
    }
}
