import UIBasePanel from "../UI/Panel/UIBasePanel";
import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";

export default class SensorDetailPanel extends UIBasePanel {
    private charts: Map<string, Chart> = new Map();
    private maxDataPoints = 10; // ✅ Limit number of points on X-axis

    constructor() {
        super("sensor-detail-panel", "Sensor Details", 600, 300);
        this.content.style.backgroundColor = "#f5f5f5";
        this.content.style.opacity = "0.9";
        this.container.style.top = "350px";
    }

    setTitle(title: string): void {
        if (this.titleBar) {
            this.titleBar.innerText = title;
        }
    }

    // ✅ Update existing charts or create new ones when a sensor is selected
    updateCharts(sensorName: string, sensorData: { name: string; timestamps: Date[]; values: number[] }[]): void {
        this.setTitle(`Sensor Details: ${sensorName}`);

        // Create charts only if they don't exist yet
        for (const data of sensorData) {
            if (!this.charts.has(data.name)) {
                const canvas = document.createElement("canvas");
                canvas.id = `sensor-detail-chart-${data.name}`;
                canvas.style.width = "100%";
                canvas.style.height = "200px";
                this.content.appendChild(canvas);

                this.charts.set(data.name, this.createChart(canvas, data.name));
            }

            // Update existing chart with new data
            const chart = this.charts.get(data.name);
            if (chart) {
                // Update chart data without clearing history
                this.updateChartData(chart, data.timestamps, data.values);
            }
        }
    }

    // New method to update chart data without resetting
    private updateChartData(chart: Chart, timestamps: Date[], values: number[]): void {
        // Add new data points to existing chart
        if (chart.data.labels) {
            for (let i = 0; i < timestamps.length; i++) {
                // Only add new data points that don't already exist
                if (!chart.data.labels.includes(timestamps[i])) {
                    chart.data.labels.push(timestamps[i]);
                    chart.data.datasets[0].data.push(values[i]);
                }
            }

            // Limit history if needed while preserving continuity
            if (chart.data.labels.length > this.maxDataPoints * 2) {
                // Keep more than just maxDataPoints to maintain history
                const keepCount = this.maxDataPoints;
                chart.data.labels = chart.data.labels.slice(-keepCount);
                chart.data.datasets[0].data = chart.data.datasets[0].data.slice(-keepCount);
            }
        } else {
            // Initialize labels if undefined
            chart.data.labels = timestamps;
            chart.data.datasets[0].data = values;
        }

        // Update chart
        chart.update("none");
    }

    // ✅ Create a real-time updating chart with X-Axis Limit
    private createChart(canvas: HTMLCanvasElement, title: string): Chart {
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("❌ ChartJS context could not be initialized.");
            throw new Error("Canvas rendering context is not available.");
        }

        return new Chart(ctx, {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: title,
                    data: [],
                    borderColor: "rgba(0, 123, 255, 1)",
                    backgroundColor: this.getGradient(ctx),
                    fill: true,  // ✅ Fill the area below the line
                    tension: 0.4, // ✅ Make the line smooth
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // ✅ Disable animations for performance
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true }
                },
                scales: {
                    x: {
                        type: "time", // ✅ Auto-manages timestamps
                        time: { unit: "second" }, // ✅ Groups time by seconds
                        title: { display: true, text: "Time" },
                        ticks: {
                            maxRotation: 0, // ✅ Prevents overlapping labels
                            autoSkip: true, // ✅ Skips labels dynamically
                            maxTicksLimit: this.maxDataPoints // ✅ Limit number of points shown
                        }
                    },
                    y: {
                        min: 10,
                        max: 40,
                        title: { display: true, text: "Temperature (°C)" }
                    }
                }
            }
        });
    }

    // ✅ Optimize gradient for performance
    private getGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, "rgba(0, 123, 255, 0.4)");
        gradient.addColorStop(1, "rgba(0, 123, 255, 0)");
        return gradient;
    }

    // ✅ Auto-update the chart with new data points every second
    updateCursor(sensorId: string, sensorData: any): void {
        console.log(`🔄 Updating cursor for sensor: ${sensorId}`);

        const samples = sensorData.getSamples(sensorId, "temperature");
        if (!samples || samples.timestamps.length === 0) {
            console.warn(`⚠️ No sample data for sensor: ${sensorId}`);
            return;
        }

        console.log(`📊 Auto-updating chart for sensor ${sensorId} with latest data.`);

        for (const chart of this.charts.values()) {
            const latestTimestamp = samples.timestamps[samples.timestamps.length - 1];
            const latestValue = samples.values[samples.values.length - 1];

            if (!latestTimestamp || latestValue === undefined) return;

            if (chart.data.labels) {
                // Only add the latest data point if it doesn't already exist
                if (!chart.data.labels.includes(latestTimestamp)) {
                    // ✅ Append only the latest data point
                    chart.data.labels.push(latestTimestamp);
                    chart.data.datasets[0].data.push(latestValue);

                    // ✅ Limit history to last maxDataPoints
                    if (chart.data.labels.length > this.maxDataPoints) {
                        chart.data.labels.shift();
                        chart.data.datasets[0].data.shift();
                    }

                    // ✅ Optimize chart update performance
                    requestAnimationFrame(() => chart.update("none"));
                }
            } else {
                // Initialize labels if undefined
                chart.data.labels = [latestTimestamp];
                chart.data.datasets[0].data = [latestValue];

                // ✅ Optimize chart update performance
                requestAnimationFrame(() => chart.update("none"));
            }
        }
    }
}
