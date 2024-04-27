import SceneNode from "./SceneNode.js";
import M3D from "../math3d/math.js";
import loadMeshBuffer from "../rend/loadMeshBuffer.js";

import defaultMaterial from "./defaultMaterial.js";

const glTFTypes = {
	SIGNED_BYTE:    5120,
	UNSIGNED_BYTE:  5121,
	SIGNED_SHORT:   5122,
	UNSIGNED_SHORT: 5123,
	UNSIGNED_INT:   5125,
	FLOAT:          5126,
};

export default function loadglTF(uri, device) {
	if (uri.endsWith(".gltf")) {
		return loadglTFAscii(uri, device);

	} else if (uri.endsWith(".glb")) {
		return loadglTFBinary(uri, device);
	}
}

export async function loadglTFAscii(uri, device) {
	const json = await fetch(uri)
		.then(v => v.text())
		.then(v => JSON.parse(v));

	console.log(json);

	return loadglTFJSON(json, device, uri);
}

export function loadglTFBinary(uri, device) {
	return new SceneNode();
}

async function loadglTFJSON(json, device, uri) {
	return new gltfData(json, device, uri).loadRootScene();
}

const base64_prefix = "data:application/octet-stream;base64,";
const base64_png_prefix = "data:image/png;base64,";
const base64_jpg_prefix = "data:image/jpeg;base64,";

export class gltfData {
	constructor(json, device, uri) {
		this.json   = json;
		this.device = device;
		this.uri    = uri;
	}

	async loadBuffers() {
		if (this.loadedBuffers) {
			return;
		}

		this.loadedBuffers = [];
		const bufferPromises = [];

		for (let i = 0; i < this.json.buffers.length; i++) {
			const uri = this.json.buffers[i].uri;

			if (uri.startsWith(base64_prefix)) {
				let data = atob(uri.substring(base64_prefix.length));
				let buf  = Uint8Array.from(data, m => m.codePointAt(0));
				this.loadedBuffers[i] = buf;

			} else {
				const diridx = this.uri.lastIndexOf("/");
				const curdir = (diridx >= 0)? this.uri.substring(0, diridx) : "";
				const fullpath = "./" + curdir + "/" + uri;

				bufferPromises[i] = fetch(fullpath)
					.then(v => v.blob())
					.then(v => v.arrayBuffer())
					.then(v => this.loadedBuffers[i] = new Uint8Array(v))
					.then(v => console.log(v))
					;
			}
		}

		await Promise.all(bufferPromises);
	}

	async loadImages() {
		if (this.loadedImages) {
			return;
		}

		this.loadedImages = [];
		const imagePromises = [];

		if (this.json.images === undefined) {
			return;
		}

		for (let i = 0; i < this.json.images.length; i++) {
			const uri = this.json.images[i].uri;

			if (!uri)
				continue;

			const diridx = this.uri.lastIndexOf("/");
			const curdir = (diridx >= 0)? this.uri.substring(0, diridx) : "";
			const isBase64 = uri.startsWith(base64_png_prefix) || uri.startsWith(base64_jpg_prefix);
			const fullpath = isBase64? uri : "./" + curdir + "/" + uri;

			console.log("Loading image:", fullpath);
			console.log(uri);

			imagePromises.push(new Promise((resolve, reject) => {
				let img = new Image();

				img.onload = () => {
					let canvas = document.createElement("canvas");
					canvas.width  = img.width;
					canvas.height = img.height;

					let ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0);

					let data = ctx.getImageData(0, 0, canvas.width, canvas.height);
					resolve(data);
				};

				img.src = fullpath;

			}).then((buf) => {
				this.loadedImages[i] = buf;
				console.log(`Image ${i}:`, buf);
			}));
		}

		await Promise.all(imagePromises);
	}

	async loadMaterials() {
		await this.loadImages();

		const defaultMat = defaultMaterial();
		this.loadedMaterials = [];

		for (let i = 0; i < this.json.materials.length; i++) {
			const ret = {};

			const mat = this.json.materials[i];
			const albedoIdx = mat.pbrMetallicRoughness?.baseColorTexture?.index ?? -1;

			console.log("material:", mat, albedoIdx);

			if (albedoIdx >= 0) {
				console.log("got here", this.loadedImages[albedoIdx]);
				ret.albedo = this.loadedImages[albedoIdx];
			}

			const temp = Object.assign({}, defaultMat, ret);
			this.loadedMaterials.push(temp);
		}
	}

	readAccessor(acc) {
		const accessor = this.json.accessors[acc];
		const bufferView = this.json.bufferViews[accessor.bufferView];
		const byteOffset = (accessor.byteOffset ?? 0) + (bufferView.byteOffset ?? 0);

		const buffer = this.loadedBuffers[bufferView.buffer];
		const view   = new DataView(buffer.buffer, byteOffset);

		const components = (accessor.type === "SCALAR")? 1
		                 : (accessor.type === "VEC2")?   2
		                 : (accessor.type === "VEC3")?   3
		                 : (accessor.type === "VEC4")?   4
		                 : (accessor.type === "MAT2")?   4
		                 : (accessor.type === "MAT3")?   9
		                 : (accessor.type === "MAT4")?   16
		                 : -1;

		const byteInc = (accessor.componentType === glTFTypes.SIGNED_BYTE)?    1
		              : (accessor.componentType === glTFTypes.UNSIGNED_BYTE)?  1
		              : (accessor.componentType === glTFTypes.SIGNED_SHORT)?   2
		              : (accessor.componentType === glTFTypes.UNSIGNED_SHORT)? 2
		              : (accessor.componentType === glTFTypes.UNSIGNED_INT)?   4
		              : (accessor.componentType === glTFTypes.FLOAT)?          4
		              : -1;

		const func = (accessor.componentType === glTFTypes.SIGNED_BYTE)?    "getInt8"
		           : (accessor.componentType === glTFTypes.UNSIGNED_BYTE)?  "getUint8"
		           : (accessor.componentType === glTFTypes.SIGNED_SHORT)?   "getInt16"
		           : (accessor.componentType === glTFTypes.UNSIGNED_SHORT)? "getUint16"
		           : (accessor.componentType === glTFTypes.UNSIGNED_INT)?   "getUint32"
		           : (accessor.componentType === glTFTypes.FLOAT)?          "getFloat32"
		           : null;

		if (byteInc < 1 || !func) {
			throw "Invalid accessor field";
		}

		const elements = accessor.count * components;
		const ret = (accessor.componentType === glTFTypes.SIGNED_BYTE)?    new Int8Array(elements)
		          : (accessor.componentType === glTFTypes.UNSIGNED_BYTE)?  new Uint8Array(elements)
		          : (accessor.componentType === glTFTypes.SIGNED_SHORT)?   new Int16Array(elements)
		          : (accessor.componentType === glTFTypes.UNSIGNED_SHORT)? new Uint16Array(elements)
		          : (accessor.componentType === glTFTypes.UNSIGNED_INT)?   new Uint32Array(elements)
		          : (accessor.componentType === glTFTypes.FLOAT)?          new Float32Array(elements)
		          : null;

		const elementSize = bufferView.byteStride ?? components*byteInc;

		for (let i = 0; i < accessor.count; i++)  {
			const compOffset = i * elementSize;
			const littleEndian = true;

			for (let k = 0; k < components; k++) {
				const offset = compOffset + k*byteInc;
				ret[components*i + k] = view[func](offset, littleEndian);
			}
		}

		return ret;
	}

	async loadMeshes() {
		await this.loadBuffers();

		if (this.loadedMeshes) {
			return;
		}

		this.loadedMeshes = [];

		for (let mesh of this.json.meshes) {
			const meshData = [];

			for (let prim of mesh.primitives) {
				const subMesh = {};

				if (prim.attributes.POSITION !== undefined) {
					subMesh.positions = this.readAccessor(prim.attributes.POSITION);
				}

				if (prim.attributes.NORMAL !== undefined) {
					subMesh.normals = this.readAccessor(prim.attributes.NORMAL);
				}

				if (prim.attributes.TANGENT !== undefined) {
					subMesh.tangents = this.readAccessor(prim.attributes.TANGENT);
				}

				if (prim.attributes.TEXCOORD_0 !== undefined) {
					subMesh.texcoords = this.readAccessor(prim.attributes.TEXCOORD_0);
				}

				if (prim.indices !== undefined) {
					subMesh.indices = this.readAccessor(prim.indices);

				} else {
					// TODO: generate identity indices for attributes
					console.error("Didn't generate identity indices, TODO", mesh, prim);
				}

				subMesh.material = prim.material;
				meshData.push(subMesh);
			}

			this.loadedMeshes.push(meshData);
		}
	}

	loadNode(nodeID) {
		const ret = new SceneNode();
		const node = this.json.nodes[nodeID];

		ret.name = node.name ?? "";

		if (node.matrix) {
			ret.setMatrix(new M3D.mat4(...node.matrix));

		} else {
			if (node.translation) ret.setPosition(new M3D.vec3(...node.translation));
			if (node.rotation)    ret.setRotation(new M3D.quat(...node.rotation));
			if (node.scale)       ret.setScale(new M3D.vec3(...node.scale));
		}

		if (node.mesh !== undefined) {
			for (let subMesh of this.loadedMeshes[node.mesh]) {
				const temp = new SceneNode();
				const material = (subMesh.material !== undefined)
					? this.loadedMaterials[subMesh.material]
					: defaultMaterial();

				// TODO: ideally shouldn't need any render state here
				temp.components.mesh     = loadMeshBuffer(this.device, subMesh);
				temp.components.material = material;
				console.log("mesh buffers:", temp.components.mesh);
				console.log("positions:", subMesh.positions);
				ret.add(temp);
			}
		}

		for (let subID of (node.children ?? [])) {
			let temp = this.loadNode(subID);
			ret.add(temp);
		}

		return ret;
	}

	async loadRootScene() {
		await this.loadBuffers();
		await this.loadMeshes();
		await this.loadImages();
		await this.loadMaterials();

		const scene = this.json.scene ?? 0;
		const nodes = this.json.scenes[scene].nodes;

		const ret = new SceneNode();

		for (let nodeid of nodes) {
			const node = this.loadNode(nodeid);
			ret.add(node);
		}

		return ret;
	}
}
