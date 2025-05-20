import { Object3D, Vector3, Box3 } from "three";

class MoverManager {
    static moverObjects: Object3D[] = [];  // ✅ Store Mover1 & Mover2 objects
    static guideShoeObjects: Object3D[] = []; // ✅ Store Guide Shoes

    // ✅ Store Movers and Guide Shoes found in `initializeScene()`
    static setMoversAndGuideshoes(moverList: Object3D[], guideShoeList: Object3D[]) {
       // ✅ Ensure we are only adding valid movers
        this.moverObjects = moverList;
        this.guideShoeObjects = guideShoeList;

        console.log(`✅ Movers Stored: ${this.moverObjects.length}`);
        console.log(`✅ Guide Shoes Stored: ${this.guideShoeObjects.length}`);
    }

    // ✅ Extract Mover Positions using bounding boxes
    static extractMoverPositions(): Vector3[] {
        const moverPositions: Vector3[] = [];

        this.moverObjects.forEach((mover) => {
            const bbox = new Box3().setFromObject(mover); // ✅ Get bounding box
            const center = new Vector3();
            bbox.getCenter(center); // ✅ Compute center from bounding box

            moverPositions.push(center);
            console.log(`📍 Mover Position Updated: ${mover.name} at (${center.x}, ${center.y}, ${center.z})`);
        });

        return moverPositions;
    }
}

export default MoverManager;
