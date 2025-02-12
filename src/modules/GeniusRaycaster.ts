import { Raycaster, Vector2, Intersection, Object3D, Mesh, MeshBasicMaterial, Camera } from 'three';
import eventBus from "./Events";

export default class GeniusRaycaster {
    private raycaster: Raycaster;
    private readonly mouse: Vector2;
    private objects: Object3D[] = [];
    private readonly camera: Camera;
    private selectedObjects: Set<Mesh> = new Set(); // ✅ Store multiple selected objects
    private hoveredObject: Mesh | null = null;
    private highlightMaterial = new MeshBasicMaterial({ color: "#f5915b" });
    private selectedMaterial = new MeshBasicMaterial({ color: "#ff0000" });

    constructor(camera: Camera, container: HTMLElement) {
        this.raycaster = new Raycaster();
        this.mouse = new Vector2();
        this.camera = camera;

        container.addEventListener('click', (event) => this.onClick(event, container));
        container.addEventListener('mousemove', (event) => this.onHover(event, container));
        container.addEventListener('mouseleave', () => this.onMouseLeave());
    }

    public setObjects(objects: Object3D[]): void {
        this.objects = objects;
    }

    private onClick(event: MouseEvent, container: HTMLElement): void {
        const intersectedObject = this.getIntersectedObject(event, container);

        // ✅ Fix: Always clear hover before selecting or deselecting
        this.resetHover();

        if (!intersectedObject) {
            // ✅ Fix: Clicking on empty space deselects everything
            if (this.selectedObjects.size > 0) {
                this.selectedObjects.forEach(obj => {
                    obj.material = obj.userData.originalMaterial;
                });
                this.selectedObjects.clear();
                eventBus.emit("deselect");
            }
            return;
        }

        // ✅ Handle Multi-Selection with Ctrl Key
        if (event.ctrlKey) {
            if (this.selectedObjects.has(intersectedObject)) {
                // ✅ Deselect object if already selected
                intersectedObject.material = intersectedObject.userData.originalMaterial;
                this.selectedObjects.delete(intersectedObject);
            } else {
                // ✅ Add new object to selection
                intersectedObject.userData.originalMaterial = intersectedObject.material;
                intersectedObject.material = this.selectedMaterial;
                this.selectedObjects.add(intersectedObject);
            }
        } else {
            // ✅ Normal selection (Single selection without Ctrl)
            this.selectedObjects.forEach(obj => obj.material = obj.userData.originalMaterial);
            this.selectedObjects.clear();

            intersectedObject.userData.originalMaterial = intersectedObject.material;
            intersectedObject.material = this.selectedMaterial;
            this.selectedObjects.add(intersectedObject);
        }

        eventBus.emit("select", Array.from(this.selectedObjects));
    }

    private onHover(event: MouseEvent, container: HTMLElement): void {
        const intersectedObject = this.getIntersectedObject(event, container);

        if (!intersectedObject) {
            this.onMouseLeave();
            return;
        }

        // ✅ Fix: If object is selected, do NOT apply hover effect
        if (this.selectedObjects.has(intersectedObject)) {
            return;
        }

        if (this.hoveredObject && !this.selectedObjects.has(this.hoveredObject)) {
            this.hoveredObject.material = this.hoveredObject.userData.originalMaterial;
        }

        intersectedObject.userData.originalMaterial = intersectedObject.material;
        intersectedObject.material = this.highlightMaterial;
        this.hoveredObject = intersectedObject;

        eventBus.emit("hover", intersectedObject);
    }

    private onMouseLeave(): void {
        this.resetHover();
        eventBus.emit("unhover");
    }

    private getIntersectedObject(event: MouseEvent, container: HTMLElement): Mesh | null {
        const rect = container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects: Intersection<Object3D>[] = this.raycaster.intersectObjects(this.objects, true);

        return (intersects.length > 0 && intersects[0].object instanceof Mesh) ? intersects[0].object : null;
    }

    private resetHover(): void {
        if (this.hoveredObject && !this.selectedObjects.has(this.hoveredObject)) {
            this.hoveredObject.material = this.hoveredObject.userData.originalMaterial;
            this.hoveredObject = null;
        }
    }
}
