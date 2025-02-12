import mitt, { Emitter } from 'mitt';
import { Object3D } from 'three';

// Define event types
type Events = {
    select: Object3D[];
    deselect: void;
    hover: Object3D;
    unhover: void;
};

// Create a shared event emitter
const eventBus: Emitter<Events> = mitt<Events>();

export default eventBus;
