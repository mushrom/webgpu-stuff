import makeCuboid from "./data/cube.js";
import M3D from "./math3d/math.js"
import ModelRenderer from "./rend/ModelRenderer.js";
import loadMeshBuffer from "./rend/loadMeshBuffer.js";

import RenderList from "./data/RenderList.js";
import SceneNode  from "./data/SceneNode.js";
import Camera     from "./data/Camera.js";

import loadglTF from "./data/gltf.js";

const adapter = await navigator.gpu?.requestAdapter();
const device  = await adapter?.requestDevice();

if (!device) {
	document.write("Couldn't acquire webgpu device!");
	throw 'need a better browser lmao';
}

console.log("adapter: ", adapter);
console.log("device: ",  device);

const canvas  = document.querySelector('canvas');
canvas.width  = window.innerWidth  - 5;
canvas.height = window.innerHeight - 5;

const context = canvas.getContext('webgpu');
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

console.log("Presentation format: ", presentationFormat);

context.configure({
	device,
	format: presentationFormat,
});

const cuboidData = makeCuboid();
const cuboidBufs = loadMeshBuffer(device, cuboidData);

const root  = new SceneNode();
const blah  = new SceneNode();
const blarg = new SceneNode();

const meshes = [];

/*
for (let k = -8; k < 8; k++) {
	for (let i = -8; i < 8; i++) {
		const node = new SceneNode();
		node.setPosition(new M3D.vec3(1.25*i, 3 + 1.25*k, -20));
		node.components.mesh = cuboidBufs;
		root.add(node);
	}
}
*/

//blah.components.mesh  = cuboidBufs;
//blarg.components.mesh = cuboidBufs;

blah.setPosition(new M3D.vec3(1, 2, 3));
blarg.setPosition(new M3D.vec3(0, -1, -2));

const gltfbox = await loadglTF("./Duck.gltf", device);
const helmet = await loadglTF("./DamagedHelmet.gltf", device);
const sponza = await loadglTF("./gltf-samples/Models/Sponza/glTF/Sponza.gltf", device);

root.add(blah, blarg);
root.add(gltfbox, helmet, sponza);
gltfbox.setPosition(new M3D.vec3(4, 2, 1));
helmet.setPosition(new M3D.vec3(2, 2, -1));
sponza.setScale(new M3D.vec3(4, 4, 4));

console.log("root", root);

const camera = new Camera();
const renderer = new ModelRenderer(device, context, presentationFormat, canvas.width, canvas.height);
renderer.cameraNode = camera;

camera.position.x = 4;
camera.position.y = 2.5;
camera.position.z = 4;

const renderLoop = () => {
	const x = Math.sin(performance.now() / 1000 / 2);
	const y = Math.cos(performance.now() / 1000 / 2);
	const s = 1 + Math.sin(performance.now() / 7000);

	const axis  = new M3D.vec3(1, 1, 1).normalize();
	const axisb = new M3D.vec3(0, 1, 0).normalize();

	gltfbox.setRotation(new M3D.quat().fromAxisAngle(axis, performance.now()/1000));
	helmet.setRotation(new M3D.quat().fromAxisAngle(axisb, performance.now()/2345));
	blah.setScale(new M3D.vec3(s, s, s));

	const worldList = new RenderList(root);

	renderer.beginFrame();
	renderer.drawRenderLists(worldList);

	worldList.destroy();
}

const pressed = {};
const state = {
	clicked: 0,
	touch:   0,
};

const mousePos = [0, 0];
const clickPos = [0, 0];
const clickQuat = new M3D.quat();
const origQuat  = new M3D.quat();

const MOUSE_LEFT   = 1;
const MOUSE_RIGHT  = 2;
const MOUSE_MIDDLE = 4;

document.onkeydown = (e) => {
	pressed[e.code] = true;
}

document.onmousemove = (e) => {
	mousePos[0] = e.clientX;
	mousePos[1] = e.clientY;
}

document.onpointermove = (e) => {
	if (e.pointerType !== "mouse") {
		mousePos[0] = e.clientX;
		mousePos[1] = e.clientY;
		e.preventDefault();
	}
}

document.onmousedown = (e) => {
	state.clicked = e.buttons;
	clickPos[0] = e.clientX;
	clickPos[1] = e.clientY;
}

document.onmouseup = (e) => {
	state.clicked = e.buttons;
}

document.onpointerdown = (e) => {
	if (e.pointerType !== "mouse") {
		state.touch = true;
		clickPos[0] = e.clientX;
		clickPos[1] = e.clientY;
		e.preventDefault();
	}
}

document.onpointerup = (e) => {
	if (e.pointerType !== "mouse") {
		state.touch = false;
		e.preventDefault();
	}
}

document.onkeyup = (e) => {
	pressed[e.code] = false;
}

document.onmouseout = (e) => {
	// reset input state if the pointer leaves the window
	state.clicked = state.touch = 0;

	for (let key in pressed) {
		pressed[key] = false;
	}
}

const inputLoop = () => {
	const speed = pressed.ShiftLeft? 0.5 : 0.1;

	const dir = new M3D.vec3();

	if (pressed.KeyW) dir.add(camera.forward);
	if (pressed.KeyQ) dir.add(camera.up);
	if (pressed.KeyD) dir.add(camera.right);

	if (pressed.KeyS) dir.sub(camera.forward);
	if (pressed.KeyE) dir.sub(camera.up);
	if (pressed.KeyA) dir.sub(camera.right);

	if (dir.lengthSq() !== 0) {
		dir.normalize();
		dir.multScalar(speed);
		camera.position.add(dir);
	}

	if (state.clicked & MOUSE_LEFT || state.touch) {
		const axis = new M3D.vec3(0, 1, 0);
		const right = new M3D.vec3(0, 0, 1);
		const amt  =  2*Math.PI * (mousePos[0] - clickPos[0]) / canvas.width;
		const hamt = -2*Math.PI * (mousePos[1] - clickPos[1]) / canvas.height;

		const meh  = new M3D.quat().fromAxisAngle(axis, amt);
		const blah = new M3D.quat().fromAxisAngle(right, M3D.clamp(hamt, -Math.PI/2, Math.PI/2));
		const rot  = new M3D.quat(origQuat);

		rot.multiply(meh).multiply(blah);
		camera.setRotation(rot);

	} else {
		origQuat.copy(camera.rotation);
	}

	camera.needsUpdate = true;
	camera.updateMatrix();
};

export default function mainLoop() {
	try {
		inputLoop();
		renderLoop();
		requestAnimationFrame(mainLoop);
	} catch (e) {
		document.write(e.message);
	}
}
