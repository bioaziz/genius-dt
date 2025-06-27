import mitt, {Emitter} from "mitt";
import {Object3D, Vector3} from "three";
import {SensorID, ChannelID} from "./../Extensions/Sensors/HistoricalDataView";

// ✅ Define event types, including `timeUpdate` as `Date`
type Events = {
    select: Object3D[];
    deselect: void;
    hover: Object3D;
    unhover: Object3D | void;
    timeUpdate: Date; // ✅ Ensures consistent Date object updates
    sensorSelected: SensorID; // ✅ New: Triggered when a sensor is clicked
    sensorHovered: SensorID; // ✅ New: Triggered when a sensor is clicked
    sensorUpdated: Record<SensorID, number>; // ✅ New: Triggered when sensor data updates
    heatmapUpdate: { channel: ChannelID; timestamp: Date }; // ✅ New: Used for triggering heatmap updates
    modelLoaded: Object3D; // ✅ New: Triggered when the GLB model has finished loading
    statorPositionsReady: Vector3[]; //
};

// ✅ Create a shared event emitter
const eventBus: Emitter<Events> = mitt<Events>();

export default eventBus;
