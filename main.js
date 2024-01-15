import makeCuboid from "./data/cube.js";
import M3D from "./math3d/math.js"
import ModelRenderer from "./rend/ModelRenderer.js";
import makeBuffer from "./rend/makeBuffer.js";

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

const loadMeshBuffer = (device, data) => {
	const vertSize = 4*4 + 2;
	const numVerts = data.positions.length;
	const vertData  = new Float32Array(numVerts * vertSize); 
	const indexData = new Uint16Array(data.indices.length); 

	const kPosition = 0;
	const kNormal   = 4;
	const kTangent  = 8;
	const kColor    = 12;
	const kTexCoord = 16;

	for (let i = 0; i < numVerts; i++) {
		for (let k = 0; k < 3; k++) {
			vertData[i*vertSize + k + kPosition] = data.positions[3*i + k];
			vertData[i*vertSize + k + kNormal]   = 0;
			vertData[i*vertSize + k + kTangent]  = 0;
			vertData[i*vertSize + k + kColor]    = 0;
		}

		for (let k = 0; k < 2; k++) {
			vertData[i*vertSize + k + kTexCoord] = data.texcoords[2*i + k];
		}
	}

	for (let i = 0; i < data.indices.length; i++) {
		indexData[i] = data.indices[i];
	}

	const copydest  = GPUBufferUsage.COPY_DST;
	const vertexBuf = makeBuffer(device, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | copydest, vertData);
	const indexBuf  = makeBuffer(device, GPUBufferUsage.INDEX  | copydest, indexData);

	return {
		vertexBuf:  vertexBuf,
		indexBuf:   indexBuf,
		numIndices: data.indices.length,
	};
}

const cuboidData = makeCuboid();
const cuboidBufs = loadMeshBuffer(device, cuboidData);

const renderer = new ModelRenderer(device, context, presentationFormat, canvas.width, canvas.height);
const renderLoop = () => {
	renderer.beginFrame();
	renderer.renderMesh(cuboidBufs);
	requestAnimationFrame(renderLoop);
}

export default function() {
	renderLoop();
}
