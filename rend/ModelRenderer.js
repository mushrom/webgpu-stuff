import flat from "./flat.js";
import makeBuffer from "./makeBuffer.js";
import M3D from "../math3d/math.js"

export default class ModelRenderer {
	constructor(device, context, format, width, height) {
		this.device   = device;
		this.context  = context;
		this.width    = width;
		this.height   = height;
		this.pipeline = flat(device, format);
		this.cameraNode = null;

		const uniformSize = 16 + 16;
		this.uniformData = new Float32Array(uniformSize);
		this.uniformBuf  = makeBuffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, this.uniformData);

		this.mainSampler = device.createSampler({
			addressModeU: "repeat",
			addressModeV: "repeat",
			magFilter: "linear",
			minFilter: "linear",
		});

		this.bindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(0),
			entries: [
				{binding: 0, resource: {buffer: this.uniformBuf}},
				{binding: 1, resource: this.mainSampler},
			],
		});

		this.depthTexture = device.createTexture({
			size:   [this.width, this.height],
			format: 'depth24plus',
			usage:  GPUTextureUsage.RENDER_ATTACHMENT,
		});

		/*
		const defaultAlbedoTex = makeDefaultAlbedoTex(device);
		device.queue.writeTexture({texture: defaultAlbedoTex}, testTexData.data,
								  {bytesPerRow: testTexData.width*4},
								  {width: testTexData.width, height: testTexData.height});
								  */

		this.renderPassDescriptor = {
			label: 'render pass',
			colorAttachments: [
				{
					// view:
					clearValue: [0.3, 0.3, 0.3, 1],
					loadOp:     'clear',
					storeOp:    'store',
				},
			],

			depthStencilAttachment: {
				view: this.depthTexture.createView(),
				depthClearValue: 1.0,
				depthLoadOp: 'clear',
				depthStoreOp: 'store',
			},
		};
	}

	updateProjection() {
		if (this.cameraNode) {
			this.cameraNode.updateMatrix();
		}

		const proj = M3D.perspective(Math.PI/3, this.width/this.height, 0.1, 100);
		const view = this.cameraNode? this.cameraNode.matrix : new M3D.mat4();

		proj.toArray(this.uniformData, 0);
		view.toArray(this.uniformData, 16);

		this.device.queue.writeBuffer(this.uniformBuf, 0, this.uniformData);
	}

	setCameraNode(node) {
		this.cameraNode = node;
	}

	beginFrame() {
		this.updateProjection();
		this.renderPassDescriptor.colorAttachments[0].view
			= this.context.getCurrentTexture().createView();
	}

	/*
	// TODO: render queue abstraction, scene -> render queues
	renderMesh(mesh) {
		const aspect = this.width / this.height;

		const encoder = this.device.createCommandEncoder();
		const pass    = encoder.beginRenderPass(this.renderPassDescriptor);

		pass.setPipeline(this.pipeline);
		pass.setBindGroup(0, this.bindGroup);
		pass.setBindGroup(1, this.defaultTexBindGroup);
		pass.setVertexBuffer(0, mesh.vertexBuf);
		pass.setIndexBuffer(mesh.indexBuf, "uint16");
		pass.drawIndexed(mesh.numIndices);
		pass.end();

		const commandBuffer = encoder.finish();
		this.device.queue.submit([commandBuffer]);
	}
	*/

	drawRenderLists(...lists) {
		const aspect = this.width / this.height;

		const encoder = this.device.createCommandEncoder();
		const pass    = encoder.beginRenderPass(this.renderPassDescriptor);

		pass.setPipeline(this.pipeline);
		pass.setBindGroup(0, this.bindGroup);

		for (const list of lists) {
			list.bufferTransforms(this.device);
			list.makeBindGroups(this.device, this.pipeline.getBindGroupLayout(2), this.pipeline.getBindGroupLayout(1));

			for (const drawable of list.drawables) {
				const {mesh, renderState} = drawable;
				// TODO: should move material parameters into mesh bind group to minimize
				//       the number of bind groups, turns out the limit on the number of bind
				//       groups is actually pretty low
				const {transformBindGroup, materialBindGroup} = renderState.bindGroups;

				if (mesh && transformBindGroup && materialBindGroup) {
					pass.setBindGroup(1, materialBindGroup);
					pass.setBindGroup(2, transformBindGroup);
					pass.setVertexBuffer(0, mesh.vertexBuf);
					pass.setIndexBuffer(mesh.indexBuf, "uint16");
					pass.drawIndexed(mesh.numIndices);
				}
			}
		}

		pass.end();

		const commandBuffer = encoder.finish();
		this.device.queue.submit([commandBuffer]);
	}
};
