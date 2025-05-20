import { Object3D, Vector3, Box3 } from "three";

class StatorManager {
    static statorPositions: Vector3[] = [];

    // ✅ Extract stator positions using bounding boxes
    static extractStatorPositions(statorList: Object3D[]): Vector3[] {
        if (!Array.isArray(statorList)) {
            console.error("❌ Error: statorList is not an array!", statorList);
            return [];
        }

        this.statorPositions = []; // Clear previous positions

        statorList.forEach((stator) => {
            const bbox = new Box3().setFromObject(stator); // ✅ Get bounding box
            const center = new Vector3();
            bbox.getCenter(center); // ✅ Compute center from bounding box

            this.statorPositions.push(center);
            console.log(`📍 Stator Position Updated: ${stator.name} at (${center.x}, ${center.y}, ${center.z})`);
        });

        return this.statorPositions;
    }
}

export default StatorManager;