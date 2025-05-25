import GeniusWorld from './modules/GeniusWorld';
import './styles/main.css';
import { BoxGeometry, MeshBasicMaterial, Mesh, SphereGeometry, Object3D } from "three";
import BoxHelperWrap from './modules/BoxHelperWrap';
import eventBus from "@/modules/Events.ts";
import SensorSpritesExtension from "@/Extensions/Sensors/SensorSpritesExtension.ts";
import StatorManager from "@/modules/StatorPositionManager.ts";
import SensorListExtension from './Extensions/Sensors/SensorListExtension';
import SensorDetailExtension from "@/Extensions/Sensors/SensorDetailExtension.ts";
import MoverManager from "./modules/MoverManager.ts";


// ✅ Initialize GeniusWorld
const container = document.getElementById('viewer') as HTMLElement;
if (!container) throw new Error("❌ 3d-gWorld container not found!");

const gWorld = new GeniusWorld(container);
gWorld.render();


// ✅ Set Camera Position
gWorld.camera.position.set(5, 20, 20);

// ✅ Add Some Example Objects
const cube = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color: "#aad020" }));
cube.position.set(0, -3, -6);
gWorld.addObject(cube);

const sphere = new Mesh(new SphereGeometry(), new MeshBasicMaterial({ color: "#7a32d1" }));
sphere.position.set(0, -3, -3);
gWorld.addObject(sphere);

// ✅ Create an instance of BoxHelperWrap
const boxHelperWrap = new BoxHelperWrap();
gWorld.scene.add(boxHelperWrap.boxHelper);

// ✅ Define Stator List

// ✅ Function to Determine if Object is a Stator or Mover
function checkIsStator(obj: Object3D): boolean {
    return obj.name.toLowerCase().includes("stator") || obj.userData.type === "stator";
}

function checkIsMover1(obj: Object3D): boolean {
    return /^Mesh_([5-9]|[1-5][0-9])$/.test(obj.name) || obj.userData.type === "mover1";
}

function checkIsMover2(obj: Object3D): boolean {
    return /^Mesh_(8[4-9]|9[0-9]|1[0-2][0-9]|13[0-8])$/.test(obj.name) || obj.userData.type === "mover2";
}

// ✅ Handle Hover Events
eventBus.on("hover", (object: Object3D) => {
    if (checkIsStator(object)) {
        boxHelperWrap.boxHelper.material.color.set('#541cc2'); // Orange for stators
        boxHelperWrap.attach(object);
        boxHelperWrap.setVisible(true);
    } else if (checkIsMover1(object)) {
        boxHelperWrap.boxHelper.material.color.set('#b62222'); // Green for movers
        boxHelperWrap.attach(object);
        boxHelperWrap.setVisible(true);
    } else if (checkIsMover2(object)) {
        boxHelperWrap.boxHelper.material.color.set('#aad020'); // Blue for mover2
        boxHelperWrap.attach(object);
        boxHelperWrap.setVisible(true);
    }
});

// ✅ Handle Unhover Events
eventBus.on("unhover", () => {
    boxHelperWrap.setVisible(false);
});

// ✅ Async Function to Initialize Scene
async function initializeScene() {
    console.log("🚀 Initializing Scene...");

    // ✅ Load the GLTF model and wait for it to finish
    await gWorld.LoadGLTF('./3D_models/4ut.glb');
    // await gWorld.LoadGLTF('./src/assets/3D_models/4ut.glb');
    console.log("✅ GLTF Model Loaded.");

    // ✅ Get object list AFTER model has loaded
    const objectWrapList = gWorld.getObject3DWrapList();
    console.log("📌 Object Wrap List:", objectWrapList);

    // ✅ Filter out stators AFTER model load
    const stator_List: Object3D[] = objectWrapList
        .filter(item => checkIsStator(item.object3D))
        .map(item => item.object3D);

    console.log("✅ Stators Found:", stator_List);

    // ✅ Extract Stator Positions using bounding box
    StatorManager.extractStatorPositions(stator_List);


    // ✅ Filter out movers & guide shoes AFTER model load
    const mover_List: Object3D[] = objectWrapList
        .filter(item => checkIsMover1(item.object3D) || checkIsMover2(item.object3D))
        .map(item => item.object3D);

    const guideShoe_List: Object3D[] = objectWrapList
        .filter(item => item.object3D.name.startsWith("guideshoe"))
        .map(item => item.object3D);

    console.log("✅ Movers Found:", mover_List);
    console.log("✅ Guide Shoes Found:", guideShoe_List);

    // ✅ Store found elements inside MoverManager
    MoverManager.setMoversAndGuideshoes(mover_List, guideShoe_List);

    // ✅ Extract Mover Positions
    MoverManager.extractMoverPositions();

    // ✅ Initialize mover position extension
    gWorld.moverPositionExtension.init();


    // ✅ Now, initialize sensor sprites AFTER stator positions are available
    const sensorSprites = new SensorSpritesExtension(gWorld);
    const sensorList = new SensorListExtension(gWorld);
    const SensorDetail = new SensorDetailExtension(gWorld);
    gWorld.addExtension(sensorSprites);
    gWorld.addExtension(sensorList);
    gWorld.addExtension(SensorDetail);
    sensorList.init();
    sensorSprites.init();
    SensorDetail.init();
    gWorld.activateAllExtensions();

    eventBus.on("sensorSelected", (sensorId) => {
    console.log(`🛠️ Sensor Selected Event Fired: ${sensorId}`);
});

    console.log("🎯 Scene Initialization Complete.");
}

// ✅ Run the async function
initializeScene().catch(console.error);

// ✅ Handle Window Resize
window.addEventListener('resize', () => gWorld.resize());
