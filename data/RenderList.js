import M3D from "../math3d/math.js";
import makeBuffer from "../rend/makeBuffer.js";

export default class RenderList {
	constructor(...nodes /* ...SceneNode */) {
		this.drawables = [];

		for (let node of nodes) {
			this.addRec(node);
		}
	}

	addRec(node, curMatrix = new M3D.mat4()) {
		node.updateMatrix();
		const temp = curMatrix.multiply(node.matrix);

		if ("mesh" in node.components) {
			//console.log("" + temp);
			this.drawables.push({
				type: "mesh",
				mesh: node.components.mesh,
				transform: temp,
				// TODO: materials, sorting
			});
		}

		for (let c of node.children) {
			this.addRec(c, temp);
		}
	}

	bufferTransforms(device) {
		if (this.hasBuffers)
			return;

		const temp  = new Float32Array(16 /* mat4 */);
		const usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

		for (const drawable of this.drawables) {
			const {mesh, transform} = drawable;
			transform.toArray(temp);

			if (mesh && mesh.transformBuf) {
				// already have a buffer created
				device.queue.writeBuffer(mesh.transformBuf, 0, temp);

			} else if (mesh) {
				console.log("Creating new transform buffer");
				mesh.transformBuf = makeBuffer(device, usage, temp);
			}
		}

		this.hasBuffers = true;
	}

	makeBindGroups(device, layout) {
		for (const drawable of this.drawables) {
			const {mesh} = drawable;
			const {transformBuf, transformBindGroup} = mesh;

			if (mesh && transformBuf && !transformBindGroup) {
				console.log("Creating new transform bind group");
				mesh.transformBindGroup = device.createBindGroup({
					layout: layout,
					entries: [
						{binding: 0, resource: {buffer: transformBuf}},
					],
				});
			}
		}
	}

	destroy() {
		for (let drawable of this.drawables) {

		}
	}
}
