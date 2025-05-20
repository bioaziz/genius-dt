import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    Color,
    Object3D,
    AxesHelper,
    AmbientLight,
    DirectionalLight, Mesh, LineBasicMaterial, LineSegments, EdgesGeometry,
} from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import mitt, {Emitter} from 'mitt';
import GeniusRaycaster from "./GeniusRaycaster";
import eventBus from "./Events";
import Object3DWrap from "../modules/Object3DWrapper.ts";
import UIBasePanel from "../Extensions/UI/Panel/UIBasePanel.ts";
import SensorExtension from "../Extensions/Sensors/SensorExtension.ts";
import SensorHeatmapExtension from "../Extensions/Sensors/SensorHeatmapExtension.ts";
import ControlPanel from "./ControlPanel";
import MoverPositionExtension from "../Extensions/Mover/MoverPositionExtension.ts";

export default class GeniusWorld {
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
    element: HTMLElement;
    orbitControls: OrbitControls;
    private axesHelper: AxesHelper | null = null;
    emitter: Emitter<any> = mitt();
    raycastObjects: Object3D[] = [];
    raycaster: GeniusRaycaster;
    object3DWrapMap: Map<string, Object3DWrap>
    object3DWrapNameMap: Map<string, Object3DWrap>
    private panels: Map<string, UIBasePanel> = new Map();
    private extensions: SensorExtension[] = [];
    sensorHeatmap: SensorHeatmapExtension;
    controlPanel: ControlPanel;
    isFullscreen: boolean = false;
    moverPositionExtension: MoverPositionExtension;


    // heatmapEnabled: boolean = true


    constructor(element: HTMLElement) {
        this.element = element;

        if (element.clientWidth === 0 || element.clientHeight === 0) {
            throw new Error('Element must have a valid width and height.');
        }

        // Renderer
        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        this.renderer.setSize(element.clientWidth, element.clientHeight);
        element.appendChild(this.renderer.domElement);

        // Scene
        this.scene = new Scene();
        this.scene.background = new Color("#aaaaaa");

        // Camera
        this.camera = new PerspectiveCamera(75, element.clientWidth / element.clientHeight, 0.1, 100000);
        this.camera.position.z = 5;

        // Add light
        this.addLights();

        // Raycaster
        this.raycaster = new GeniusRaycaster(this.camera, this.element);

        // OrbitControls
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        // this.orbitControls.minDistance = 2;
        // this.orbitControls.maxDistance = 10;

        // ✅ Attach Control Panel inside the Three.js container
        this.controlPanel = new ControlPanel();
        this.sensorHeatmap = new SensorHeatmapExtension(this);
        // this.controlPanel.addHeatmapButton()
        this.sensorHeatmap.init(); // ✅ Ensure init() is called
        // ✅ Initialize Mover Extension
        this.moverPositionExtension = new MoverPositionExtension(this);
        // this.moverPositionExtension.init();

        this.setupControlPanelButtons();  // ✅ Attach the control panel to the viewer container

        this.object3DWrapMap = new Map()
        this.object3DWrapNameMap = new Map()

        // Event handling
        eventBus.on("select", (object: Object3D[]) => console.log("Object selected:", object));
        eventBus.on("hover", (object) => console.log("Hovered over:", object.name));
        eventBus.on("deselect", () => console.log("Deselected object."));
        eventBus.on("unhover", () => console.log("Unhovered all."));
    }

    // Render
    public render(): void {
        const rendering = () => {
            requestAnimationFrame(rendering);
            this.orbitControls.update();
            this.renderer.render(this.scene, this.camera);
        };
        rendering();
    }

    // Resize
    public resize(): void {
        const {clientWidth, clientHeight} = this.element;
        this.camera.aspect = clientWidth / clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(clientWidth, clientHeight);
    }

    // Add light
    private addLights(): void {
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;

        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;

        this.scene.add(directionalLight);
    }

    // ✅ Function to add outlines to mesh objects
    // @ts-ignore
    private addOutline(object: Object3D): void {
        if (object instanceof Mesh) {
            const edges = new EdgesGeometry(object.geometry); // Extract edges
            const lineMaterial = new LineBasicMaterial({color: 0xffffff}); // White outline
            const outline = new LineSegments(edges, lineMaterial);

            object.add(outline); // Add outline as a child of the object
        }
    }

    // ✅ Modify LoadGLTF to apply outlines automatically


    public async LoadGLTF(fileURL: string): Promise<Object3D> {
        if (!fileURL) {
            throw new Error("Invalid file URL");
        }

        return new Promise((resolve, reject) => {
            const gltfLoader = new GLTFLoader();
            const loadingTimeout = setTimeout(() => {
                reject(new Error('GLTF loading timed out.'));
            }, 10000);

            this.emitter.emit("loading-start");

            gltfLoader.load(
                fileURL,
                (gltf) => {
                    clearTimeout(loadingTimeout);
                    this.scene.add(gltf.scene);
                    this.raycastObjects.push(gltf.scene);
                    this.raycaster.setObjects(this.raycastObjects);


                    // ✅ Apply outline to all meshes in the model
                    // gltf.scene.traverse((child) => {
                    //     this.addOutline(child);
                    // });


                    // ✅ Register objects inside GeniusWorld (Fix missing wraps)
                    gltf.scene.traverse((child) => {
                        if (child instanceof Object3D) {
                            child.updateMatrixWorld(true); // ✅ Force update world positions
                            this.raycastObjects.push(child);
                            const wrappedObject = new Object3DWrap(child);
                            this.object3DWrapMap.set(child.uuid, wrappedObject);
                            this.object3DWrapNameMap.set(child.name, wrappedObject);
                        }
                    });

                    this.raycaster.setObjects(this.raycastObjects); // ✅ Set objects in raycaster

                    // ✅ Emit event that model has fully loaded
                    eventBus.emit("modelLoaded", gltf.scene);

                    this.emitter.emit("loading-complete", gltf.scene);
                    resolve(gltf.scene);
                },
                (progress) => {
                    this.emitter.emit("loading-progress", progress.loaded / progress.total);
                },
                (error) => {
                    clearTimeout(loadingTimeout);
                    this.emitter.emit("loading-error", error);
                    reject(error);
                }
            );
        });
    }

    // Add object to the scene
    public addObject(object: Object3D): void {
        this.scene.add(object);
        this.raycastObjects.push(object);
        this.raycaster.setObjects(this.raycastObjects);
    }


    // Add Axes helper
    public addAxesHelper(size: number = 5): void {
        if (!this.axesHelper) {
            this.axesHelper = new AxesHelper(size);
            this.scene.add(this.axesHelper);
        }
    }

    // Remove Axes helper
    public removeAxesHelper(): void {
        if (this.axesHelper) {
            this.scene.remove(this.axesHelper);
            this.axesHelper = null;
        }
    }

    // Toggle Axes helper
    public toggleAxesHelper(_isActive: boolean): void {
        if (this.axesHelper) {
            this.removeAxesHelper();
        } else {
            this.addAxesHelper();
        }
    }

    // ✅ Expose hovered object from GeniusRaycaster
    public getHoveredObject(): Object3D | null {
        return this.raycaster.getHoveredObject();
    }

    private setupControlPanelButtons() {
        this.controlPanel.addButton("./icons/axes_w.svg", "Axes", (isActive) => {
            this.toggleAxesHelper(isActive)
        });

        this.controlPanel.addButton("./icons/expand.svg", "Fullscreen", (isActive) => {
            this.toggleFullscreen(isActive);
        });

        this.controlPanel.addButton("./icons/flame-red.svg", "Heatmap", (isActive) => {
            this.sensorHeatmap.toggleHeatmap(isActive);
        });
    }

    // ✅ Function to Toggle Fullscreen
    private toggleFullscreen(_isActive: boolean) {
        if (!document.fullscreenElement) {
            this.element.requestFullscreen().then(() => {
                this.isFullscreen = true;
            });
        } else {
            document.exitFullscreen().then(() => {
                this.isFullscreen = false;
            });
        }
    }

    // ✅ Function to Toggle Heatmap
    // private toggleHeatmap(isActive: boolean) {
    //     this.heatmapEnabled = isActive;
    //
    //     if (this.heatmapEnabled) {
    //         this.sensorHeatmap.applyHeatmap();
    //     } else {
    //         this.sensorHeatmap.clearHeatmap();
    //     }
    //
    //     console.log(`🔥 Heatmap ${this.heatmapEnabled ? "Enabled" : "Disabled"}`);
    // }


    getObject3DWrapList(): Object3DWrap[] {
        return Array.from(this.object3DWrapMap.values())
    }

    getObject3DWrap(obj: Object3D): Object3DWrap | null {
        const result = this.object3DWrapMap.get(obj.uuid)
        if (result === undefined) {
            return null
        } else {
            return result
        }
    }

    getObject3DWrapByFullName(fullName: string): Object3DWrap | null {
        const result = this.object3DWrapNameMap.get(fullName)
        if (result === undefined) {
            return null
        } else {
            return result
        }
    }


    // ✅ Function to add panels
    public addPanel(id: string, panel: UIBasePanel): void {
        this.panels.set(id, panel);
        panel.setVisible(true);
    }

    public removePanel(id: string): void {
        const panel = this.panels.get(id);
        if (panel) {
            panel.dispose();
            this.panels.delete(id);
        }
    }

    public removeAllPanels(): void {
        this.panels.forEach(panel => panel.dispose());
        this.panels.clear();
    }

    // ✅ Function to add extensions
    public addExtension(extension: SensorExtension): void {
        this.extensions.push(extension);
    }

    public removeExtension(extension: SensorExtension): void {
        const index = this.extensions.indexOf(extension);
        if (index !== -1) {
            this.extensions.splice(index, 1);
        }
    }

    public activateAllExtensions(): void {
        this.extensions.forEach(ext => ext.activate());
    }

    public deactivateAllExtensions(): void {
        this.extensions.forEach(ext => ext.deactivate());
    }
}
