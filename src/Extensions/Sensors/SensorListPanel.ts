import UIBasePanel from "../UI/Panel/UIBasePanel";
import {getSensorData} from "./sensorUtils";
import {HistoricalDataView} from "./HistoricalDataView";
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
        this.initializeOutsideClickListener();
        // ✅ Populate Initial Data
        this.populateTable(this.getSensorData());
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

    private initializeOutsideClickListener() {
        document.addEventListener("click", (event) => {
            const isClickInsideTable = this.container.contains(event.target as Node);

            if (!isClickInsideTable && this.selectedRow) {
                this.selectedRow.style.backgroundColor = ""; // ✅ Reset Highlight
                this.selectedRow = null; // ✅ Clear Selection
                console.log("🔄 Deselected Sensor");
            }
        });
    }

}
