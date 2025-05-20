import UIBasePanel from "../UI/Panel/UIBasePanel";
import { getSensorData } from "./sensorUtils";
import { HistoricalDataView, ChannelID } from "./HistoricalDataView";

export default class SensorHeatmapsPanel extends UIBasePanel {
    private dropdown: HTMLSelectElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    public onChannelChanged?: (channelId: ChannelID) => void;
    private dataView: HistoricalDataView | null = null;

    constructor() {
        super("sensor-heatmaps-panel", "Sensor Heatmaps", 350, 250);

        this.content.style.backgroundColor = "#333";
        this.content.style.color = "#eee";
        this.content.style.opacity = "0.9";
        this.container.style.top = "650px";

        // ✅ Create UI Elements
        this.createControls();
        this.dataView = getSensorData();
        this.updateChannels();
    }

    private createControls() {
        // ✅ Dropdown Container
        const controlsContainer = document.createElement("div");
        controlsContainer.style.display = "flex";
        controlsContainer.style.flexDirection = "column";
        controlsContainer.style.padding = "10px";
        controlsContainer.style.borderBottom = "2px solid #fff";


        const label = document.createElement("label");
        label.innerText = "Channel:";
        label.style.color = "white";

        this.dropdown = document.createElement("select");
        this.dropdown.id = "iot-heatmap-channel";
        this.dropdown.style.padding = "5px";
        this.dropdown.style.marginTop = "5px";
        this.dropdown.style.border = "1px solid #666";

        controlsContainer.appendChild(label);
        controlsContainer.appendChild(this.dropdown);
        this.content.appendChild(controlsContainer);

        // ✅ Heatmap Toggle Button
        // this.toggleButton = document.createElement("button");
        // this.toggleButton.innerText = "Toggle Heatmap";
        // Object.assign(this.toggleButton.style, {
        //     marginTop: "10px",
        //     padding: "5px",
        //     background: "#ff6600",
        //     color: "white",
        //     border: "none",
        //     cursor: "pointer",
        // });
        //
        // this.content.appendChild(this.toggleButton);

        // ✅ Heatmap Legend (Restored)
        this.canvas = document.createElement("canvas");
        this.canvas.width = 300;
        this.canvas.height = 50;
        this.canvas.id = "iot-heatmap-legend";
        this.canvas.style.marginTop = "10px";
        this.canvas.style.color = "white";
        this.content.appendChild(this.canvas);

        this.dropdown.onchange = () => this.onDropdownChanged();
    }



    public updateChannels() {
        if (!this.dropdown || !this.dataView) return;

        const channels = this.dataView.getChannels();
        this.dropdown.innerHTML = "";
        for (const [channelId, channel] of channels.entries()) {
            const option = document.createElement("option");
            option.value = channelId;
            option.innerText = channel.name;
            this.dropdown.appendChild(option);
        }

        this.onDropdownChanged();
    }

    private onDropdownChanged() {
        if (!this.dropdown) return;
        const selectedChannel = this.dropdown.value as ChannelID;
        if (this.onChannelChanged) this.onChannelChanged(selectedChannel);
        this.updateLegend();
    }

    // ✅ Updates the heatmap legend dynamically
    public updateLegend() {
        if (!this.canvas || !this.dataView) return;
        const ctx = this.canvas.getContext("2d");
        if (!ctx) return;


        ctx.fillStyle = "white";

        // ✅ Set Min and Max Values for the Channel
        const minValue = 10;
        const maxValue = 40;
        const labels = [`${minValue}°C`, `${(minValue + maxValue) / 2}°C`, `${maxValue}°C`];

        // ✅ Define Heatmap Colors
        const colorStops = ["blue", "green", "yellow", "red"];

        ctx.fillText(labels[0], 10, 10);
        ctx.fillText(labels[1], 140, 10);
        ctx.fillText(labels[2], 280, 10);

        // ✅ Create Gradient for Heatmap Legend
        const gradient = ctx.createLinearGradient(0, 0, 300, 0);
        colorStops.forEach((color, i) => gradient.addColorStop(i / (colorStops.length - 1), color));

        ctx.fillStyle = gradient;
        ctx.fillRect(10, 20, 280, 20);
    }
}
