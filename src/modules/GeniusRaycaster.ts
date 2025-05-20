import { Raycaster, Vector2, Intersection, Object3D, Mesh, Sprite, SpriteMaterial, MeshBasicMaterial, Camera } from "three";
import eventBus from "./Events";

export default class GeniusRaycaster {
    private raycaster: Raycaster;
    private readonly mouse: Vector2;
    private objects: Object3D[] = [];
    private readonly camera: Camera;
    private selectedObjects: Set<Object3D> = new Set(); // ✅ Store multiple selected objects (Mesh & Sprite)
    private hoveredObject: Object3D | null = null;
    private highlightMaterial = new MeshBasicMaterial({ color: "#f5915b" });
    private selectedMaterial = new MeshBasicMaterial({ color: "#ff0000" });

    constructor(camera: Camera, container: HTMLElement) {
        this.raycaster = new Raycaster();
        this.mouse = new Vector2();
        this.camera = camera;

        container.addEventListener("click", (event) => this.onClick(event, container));
        container.addEventListener("mousemove", (event) => this.onHover(event, container));
        container.addEventListener("mouseleave", () => this.onMouseLeave());
    }

    // ✅ Allow both `Mesh` and `Sprite` in the raycast list
    public setObjects(objects: Object3D[]): void {
        this.objects = objects.filter(obj => obj instanceof Mesh || obj instanceof Sprite);
        console.log(`🎥 Raycaster Objects Updated:`, this.objects);
    }

    // ✅ Handle Click Event (Select objects)
    private onClick(event: MouseEvent, container: HTMLElement): void {
        const intersectedObject = this.getIntersectedObject(event, container);

        this.resetHover();

        if (!intersectedObject) {
            if (this.selectedObjects.size > 0) {
                this.selectedObjects.forEach(obj => {
                    if (obj instanceof Mesh) obj.material = obj.userData.originalMaterial;
                    if (obj instanceof Sprite) {
                (obj as Sprite).scale.set(0.3, 0.2, 0.3); // ✅ Reset scale if deselected
            }
                });
                this.selectedObjects.clear();
                eventBus.emit("deselect");
            }
            return;
        }

        console.log("🖱️ Clicked Object Type:", intersectedObject.type, intersectedObject);

        if (event.ctrlKey) {
            if (this.selectedObjects.has(intersectedObject)) {
                if (intersectedObject instanceof Mesh) {
                    intersectedObject.material = intersectedObject.userData.originalMaterial;
                }
                this.selectedObjects.delete(intersectedObject);
            } else {
                if (intersectedObject instanceof Mesh) {
                    intersectedObject.userData.originalMaterial = intersectedObject.material;
                    intersectedObject.material = this.selectedMaterial;
                }
                this.selectedObjects.add(intersectedObject);
            }
        } else {
            this.selectedObjects.forEach(obj => {
                if (obj instanceof Mesh) obj.material = obj.userData.originalMaterial;
            });
            this.selectedObjects.clear();

            if (intersectedObject instanceof Mesh) {
                intersectedObject.userData.originalMaterial = intersectedObject.material;
                intersectedObject.material = this.selectedMaterial;
            }
            this.selectedObjects.add(intersectedObject);
        }

        eventBus.emit("select", Array.from(this.selectedObjects));
    }

    // ✅ Handle Hover Event
    private onHover(event: MouseEvent, container: HTMLElement): void {
        const intersectedObject = this.getIntersectedObject(event, container);
        console.log("🔍 Hovered Object Type:", intersectedObject?.type, intersectedObject);

        if (!intersectedObject) {
            this.onMouseLeave();
            return;
        }

        if (this.selectedObjects.has(intersectedObject)) {
            return;
        }

        if (this.hoveredObject && !this.selectedObjects.has(this.hoveredObject)) {
            if (this.hoveredObject instanceof Mesh) {
                this.hoveredObject.material = this.hoveredObject.userData.originalMaterial;
            } else if (this.hoveredObject instanceof Sprite) {
                const spriteMaterial = this.hoveredObject.material as SpriteMaterial;
                spriteMaterial.opacity = 1.0; // ✅ Restore opacity for sprites
            }
        }

        if (intersectedObject instanceof Mesh) {
            intersectedObject.userData.originalMaterial = intersectedObject.material;
            intersectedObject.material = this.highlightMaterial;
        } else if (intersectedObject instanceof Sprite) {
            const spriteMaterial = intersectedObject.material as SpriteMaterial;
            spriteMaterial.opacity = 0.5; // ✅ Make sprite slightly transparent on hover
        }

        this.hoveredObject = intersectedObject;

        eventBus.emit("hover", intersectedObject);
    }

    // ✅ Handle Mouse Leave
private onMouseLeave(): void {
    console.log("🛑 Mouse Left Canvas, Resetting Hovered Object...");

    if (this.hoveredObject) {
        if (this.hoveredObject instanceof Mesh) {
            this.hoveredObject.material = this.hoveredObject.userData.originalMaterial;
        } else if (this.hoveredObject instanceof Sprite) {
            const spriteMaterial = this.hoveredObject.material as SpriteMaterial;
            spriteMaterial.opacity = 1.0; // ✅ Restore sprite opacity when unhovered
        }
        eventBus.emit("unhover", this.hoveredObject);
        this.hoveredObject = null; // ✅ Clear hovered object
    }
}

    // ✅ Detect Both `Mesh` & `Sprite` Objects
    private getIntersectedObject(event: MouseEvent, container: HTMLElement): Object3D | null {
        const rect = container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects: Intersection<Object3D>[] = this.raycaster.intersectObjects(this.objects, true);

        if (intersects.length > 0) {
            console.log("🎯 Raycaster Hit:", intersects[0].object.type, intersects[0].object);
            return intersects[0].object;
        }

        return null;
    }

    // ✅ Reset Hover Effect
    private resetHover(): void {
        if (this.hoveredObject && !this.selectedObjects.has(this.hoveredObject)) {
            if (this.hoveredObject instanceof Mesh) {
                this.hoveredObject.material = this.hoveredObject.userData.originalMaterial;
            } else if (this.hoveredObject instanceof Sprite) {
                const spriteMaterial = this.hoveredObject.material as SpriteMaterial;
                spriteMaterial.opacity = 1.0; // ✅ Restore sprite opacity
            }
            this.hoveredObject = null;
        }
    }

    // ✅ Get Hovered Object
    public getHoveredObject(): Object3D | null {
        return this.hoveredObject;
    }
}
