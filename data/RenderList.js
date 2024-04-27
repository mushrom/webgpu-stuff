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

		if ("mesh" in node.components && "material" in node.components) {
			//console.log("" + temp);
			this.drawables.push({
				type: "mesh",
				mesh: node.components.mesh,
				material: node.components.material,
				transform: temp,
				renderState: node.renderState,
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
			const {mesh, material, transform, renderState} = drawable;
			transform.toArray(temp);

			if (!mesh) {
				continue;
			}

			if (renderState.buffers.meshTransform) {
				// already have a buffer created
				device.queue.writeBuffer(renderState.buffers.meshTransform, 0, temp);

			} else {
				console.log("Creating new transform buffer");
				renderState.buffers.meshTransform = makeBuffer(device, usage, temp);
			}

			if (!renderState.buffers.material) {
				console.log("Creating material textures", material);
				renderState.buffers.material = {};

				for (let name in material) {
					const img = material[name];
					if (!img) continue;

					const tex = device.createTexture({
						size:   [img.width, img.height],
						format: 'rgba8unorm',
						usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
					});

					device.queue.writeTexture({texture: tex}, img.data,
					                          {bytesPerRow: img.width*4},
					                          {width: img.width, height: img.height});

					renderState.buffers.material[name] = tex;
				}
			}
		}

		this.hasBuffers = true;
	}

	makeBindGroups(device, transformLayout, materialLayout) {
		for (const drawable of this.drawables) {
			const {mesh, renderState}  = drawable;
			const {transformBindGroup, materialBindGroup} = renderState.bindGroups;
			const {meshTransform, material} = renderState.buffers;

			if (!mesh)
				continue;

			if (meshTransform && !transformBindGroup) {
				console.log("Creating new transform bind group");
				renderState.bindGroups.transformBindGroup = device.createBindGroup({
					layout: transformLayout,
					entries: [
						{binding: 0, resource: {buffer: meshTransform}},
					],
				});
			}

			// TODO: check for changed materials
			if (material && !materialBindGroup) {
				console.log("Creating new material bind group");
				renderState.bindGroups.materialBindGroup = device.createBindGroup({
					layout: materialLayout,
					entries: [
						{binding: 0, resource: material.albedo.createView()},
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
