import { Object3D } from "three";

/**
 * ✅ Checks if an object is a Stator or Mover
 */
export function checkIsElement(obj: Object3D, elementType?: string): boolean {
    if (!obj.name) return false;

    if (elementType) {
        return obj.name.toLowerCase().includes(elementType.toLowerCase()) || obj.userData.type === elementType;
    }

    return ["stator", "mover"].some(type =>
        obj.name.toLowerCase().includes(type) || obj.userData.type === type
    );
}

/**
 * ✅ Checks if an object is a Sensor attached to an element
 */
export function checkIsSensor(obj: Object3D, sensorType?: string): boolean {
    if (!obj.name) return false;

    if (sensorType) {
        return obj.name.toLowerCase().includes(sensorType.toLowerCase()) || obj.userData.type === sensorType;
    }

    return ["temperature", "vibration", "pressure"].some(type =>
        obj.name.toLowerCase().includes(type) || obj.userData.type === type
    );
}
