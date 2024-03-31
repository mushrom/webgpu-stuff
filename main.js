import makeCuboid from "./data/cube.js";
import M3D from "./math3d/math.js"
import ModelRenderer from "./rend/ModelRenderer.js";
import loadMeshBuffer from "./rend/loadMeshBuffer.js";

import RenderList from "./data/RenderList.js";
import SceneNode  from "./data/SceneNode.js";

import loadglTF from "./data/gltf.js";

const foo = new M3D.vec3(1, 0, 0);
const bar = new M3D.vec3(0, 0, 1);
const baz = foo.cross(bar);
console.log('' + baz);

const adapter = await navigator.gpu?.requestAdapter();
const device  = await adapter?.requestDevice();

if (!device) {
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

for (let k = -8; k < 8; k++) {
	for (let i = -8; i < 8; i++) {
		const node = new SceneNode();
		node.setPosition(new M3D.vec3(1.25*i, 3 + 1.25*k, -20));
		node.components.mesh = cuboidBufs;
		root.add(node);
	}
}

blah.components.mesh  = cuboidBufs;
blarg.components.mesh = cuboidBufs;

blah.setPosition(new M3D.vec3(1, 2, 3));
blarg.setPosition(new M3D.vec3(0, -1, -2));

//const gltfbox = await loadglTF("./Duck.gltf", device);
const gltfbox = await loadglTF("./DamagedHelmet.gltf", device);
//const gltfbox = await loadglTF("./Box.gltf", device);

root.add(blah, blarg);
root.add(gltfbox);
gltfbox.setPosition(new M3D.vec3(1, 2, -3));
//gltfbox.setScale(new M3D.vec3(0.01, 0.01, 0.01));
console.log("root", root);

const renderer = new ModelRenderer(device, context, presentationFormat, canvas.width, canvas.height);
const renderLoop = () => {
	const x = Math.sin(performance.now() / 1000);
	const y = Math.cos(performance.now() / 1000);
	const s = 1 + Math.sin(performance.now() / 7000);

	root.setPosition(new M3D.vec3(x, y, -15));
	blah.setScale(new M3D.vec3(s, s, s));

	const worldList = new RenderList(root);

	renderer.beginFrame();
	renderer.drawRenderLists(worldList);

	worldList.destroy();
	requestAnimationFrame(renderLoop);
}

export default function() {
	renderLoop();
}
