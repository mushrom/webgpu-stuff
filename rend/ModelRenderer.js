import flat from "./flat.js";
import makeBuffer from "./makeBuffer.js";
import M3D from "../math3d/math.js"

const makeTestTexture = () => {
	const data = [];

	for (let x = 0; x < 32; x++) {
		for (let y = 0; y < 32; y++) {
			const val = (x^y) << 3;
			data.push([val, val, val, 255]);
		}
	}

	return {
		width: 32,
		height: 32,
		data: new Uint8Array(data.flat()),
	};
};

const testTexData = makeTestTexture();
const makeDefaultAlbedoTex = (device) => device.createTexture({
	size:   [testTexData.width, testTexData.height],
	format: 'rgba8unorm',
	usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
});

export default class ModelRenderer {
	constructor(device, context, format, width, height) {
		this.device   = device;
		this.context  = context;
		this.width    = width;
		this.height   = height;
		this.pipeline = flat(device, format);

		const uniformSize = 16 + 16;
		this.uniformData = new Float32Array(uniformSize);
		this.uniformBuf  = makeBuffer(device, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, this.uniformData);

		this.mainSampler = device.createSampler({});

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

		const defaultAlbedoTex = makeDefaultAlbedoTex(device);
		device.queue.writeTexture({texture: defaultAlbedoTex}, testTexData.data,
								  {bytesPerRow: testTexData.width*4},
								  {width: testTexData.width, height: testTexData.height});

		this.defaultTexBindGroup = device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(1),
			entries: [
				{binding: 0, resource: defaultAlbedoTex.createView()},
			],
		});

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
		const proj = M3D.perspective(Math.PI/4, this.width/this.height, 0.1, 100);
		const x = Math.sin(performance.now() / 1000);
		const y = Math.cos(performance.now() / 1000);
		const view = M3D.translation(new M3D.vec3(x, y, -5));
		proj.toArray(this.uniformData, 0);
		view.toArray(this.uniformData, 16);
		this.device.queue.writeBuffer(this.uniformBuf, 0, this.uniformData);
	}

	beginFrame() {
		this.updateProjection();
		this.renderPassDescriptor.colorAttachments[0].view
			= this.context.getCurrentTexture().createView();
	}

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
};