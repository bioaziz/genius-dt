import GeniusWorld from './modules/GeniusWorld';
import ControlPanel from "./modules/ControlPanel";
import './styles/main.css';
import {BoxGeometry, MeshBasicMaterial, Mesh, SphereGeometry, Object3D} from "three";
import BoxHelperWrap from './modules/BoxHelperWrap';
import eventBus from "@/modules/Events.ts";
// Initialize GeniusWorld
const container = document.getElementById('3d-gWorld') as HTMLElement;
if (!container) throw new Error("3d-gWorld container not found!");

const gWorld = new GeniusWorld(container);

gWorld.render();

// Initialize ControlPanel
const controlPanel = new ControlPanel();

// Add buttons
controlPanel.addButton('Toggle AxesHelper', () => {
    gWorld.toggleAxesHelper();
});

// // Add objects
// const cube = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color: "#f68404" }));
// cube.position.set(0, 3, 0);
// gWorld.addObject(cube);
//
// const sphere = new Mesh(new SphereGeometry(), new MeshBasicMaterial({ color: "#7a32d1" }));
// sphere.position.set(0, 3, 3);
// gWorld.addObject(sphere);

// Load a GLTF model
//
// gWorld.LoadGLTF('./src/assets/3D_models/4_Unit_Tower.glb').then(() => {
//     console.log("GLTF Loaded.");
// });
gWorld.LoadGLTF('./src/assets/3D_models/4_ut.glb').then((model) => {
    console.log("GLTF Loaded.");
    model.rotation.z = Math.PI
        const objectWrapList = gWorld.getObject3DWrapList();
    console.log("Object Wrap List:", objectWrapList);

    objectWrapList.forEach(item => {
        if (checkIsStator(item.object3D)) {
            statorList.push(item.object3D);
        }
    });

});
const objectWrapList = gWorld.getObject3DWrapList()


  objectWrapList.forEach(item => {
    if (checkIsStator(item.object3D)) {
      statorList.push(item.object3D)
    }
      })
// Handle window resize
window.addEventListener('resize', () => gWorld.resize());

const statorList : Object3D[] = []

// ✅ Create an instance of BoxHelperWrap
const boxHelperWrap = new BoxHelperWrap(); // Red color for highlighting
gWorld.scene.add(boxHelperWrap.boxHelper);

// Function to determine if an object is a stator
function checkIsStator(obj: Object3D): boolean {
    return obj.name.toLowerCase().includes("stator") || obj.userData.type === "stator";
}

// Function to determine if an object is a mover
// function checkIsMover(obj: Object3D): boolean {
//     const moverNames = ["Mesh_54", "Mesh_53", "Mesh_55", "Mesh_56", "Mesh_108"]; // Add all mover meshes here
//     return moverNames.includes(obj.name) || obj.userData.type === "mover";
// }
function checkIsMover1(obj: Object3D): boolean {
    return /^Mesh_(5[0-9]|[1-4]?[0-9])$/.test(obj.name) || obj.userData.type === "mover1";
}

function checkIsMover2(obj: Object3D): boolean {
    return /^Mesh_(8[4-9]|9[0-9]|1[0-2][0-9]|13[0-8])$/.test(obj.name) || obj.userData.type === "mover2";
}

// Listen for hover events
eventBus.on("hover", (object: Object3D) => {
    if (checkIsStator(object)) {
        boxHelperWrap.boxHelper.material.color.set('#f68404'); // Green for stators
        boxHelperWrap.attach(object);
        boxHelperWrap.setVisible(true);
    } else if (checkIsMover1(object)) {
        boxHelperWrap.boxHelper.material.color.set('#04f618'); // Red for movers
        boxHelperWrap.attach(object);
        boxHelperWrap.setVisible(true);
    } else if (checkIsMover2(object)) {
        boxHelperWrap.boxHelper.material.color.set('#1804f6'); // Blue for mover2
        boxHelperWrap.attach(object);
        boxHelperWrap.setVisible(true);
    }
});

// Listen for unhover events
eventBus.on("unhover", () => {
    boxHelperWrap.setVisible(false);
});

