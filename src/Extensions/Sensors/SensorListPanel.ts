import UIBasePanel from "../UI/Panel/UIBasePanel";
import {getSensorData} from "./sensorUtils";
import {HistoricalDataView, SensorID} from "./HistoricalDataView";
import eventBus from "./../../modules/Events.ts"; // ✅ Ensure Events are used

export default class SensorListPanel extends UIBasePanel {
    private dataView: HistoricalDataView | null = null;

    constructor() {
        super("sensor-list-panel", "📋 Sensor List", 600, 300);

        console.log("📌 SensorListPanel Constructor Called...");
        this.dataView = getSensorData();

        // ✅ Initialize Table with Columns
        this.initializeTable([
            {title: "Sensor_id", field: "id"},
            {title: "Sensor", field: "sensor"},
            {title: "Group", field: "group"},
        ]);
        // ✅ Populate Initial Data
        this.populateTable(this.getSensorData());

        this.initializeEventBusListeners();
    }

    private getSensorData() {
        if (!this.dataView) return [];

        const rows = [];
        for (const [sensorId, sensor] of this.dataView.getSensors().entries()) {
            console.log(`📋 Adding Sensor: ${sensorId}, Group: ${sensor.groupName}`);
            rows.push({
                id: sensorId,
                sensor: sensor.name,
                group: sensor.groupName,
            });
        }
        return rows;
    }

    // ✅ Override Row Click Logic
    protected onRowClicked(row: HTMLTableRowElement) {
        const sensorId = row.dataset.sensorId;
        if (!sensorId) return;
        console.log(`📌 Sensor Selected from Table: ${sensorId}`);
        super.onRowClicked(row);
        eventBus.emit("sensorSelected", sensorId);
    }

    private initializeEventBusListeners(): void {
        eventBus.on("sensorSelected", (sensorId: SensorID) => this.highlightSensor(sensorId));
        eventBus.on("deselect", () => this.clearSelection());
    }

    private highlightSensor(sensorId: SensorID): void {
        if (!this.table) return;
        const row = this.table.querySelector<HTMLTableRowElement>(`tr[data-sensor-id="${sensorId}"]`);
        if (!row) return;

        super.onRowClicked(row); // Highlight without re-emitting event
    }

    private clearSelection(): void {
        if (this.selectedRow) {
            this.selectedRow.style.backgroundColor = "";
            this.selectedRow = null;
            console.log("🔄 Deselected Sensor");
        }
    }

}
