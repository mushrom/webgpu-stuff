import M3D from '../math3d/math.js';

import vertex_model from "./shaders/vertex-model.js";
import fragment_unshaded from "./shaders/fragment-unshaded.js";

// Create an unshaded render pipeline
export default function(device, targetFormat, pipelineOpts = {}) {
	const vert = vertex_model(device);
	const frag = fragment_unshaded(device);

	const uniformLayout = device.createBindGroupLayout({
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				buffer: { type: "uniform" },
			},
			{
				binding: 1,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				sampler: {type: "non-filtering"},
			},
		],
	});

	const textureLayout = device.createBindGroupLayout({
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				texture: { sampleType: "float" },
			},
		],
	});

	const baseOpts = {
		label: "Flat-shaded render pipeline",
		//layout: "auto",
		layout: device.createPipelineLayout({
			bindGroupLayouts: [uniformLayout, textureLayout],
		}),

		primitive: {
			topology: "triangle-list",
			cullMode: "none",
		},

		depthStencil: {
			depthWriteEnabled: true,
			depthCompare: "less",
			format: "depth24plus",
		},

		vertex: {
			module: vert,
			entryPoint: "vs",
			buffers: [
				{
					arrayStride: 4*4*4 + 2*4,
					attributes: [
						{shaderLocation: 0, offset: 0,  format: "float32x3"},
						{shaderLocation: 1, offset: 16, format: "float32x3"},
						{shaderLocation: 2, offset: 32, format: "float32x3"},
						{shaderLocation: 3, offset: 48, format: "float32x3"},
						{shaderLocation: 4, offset: 64, format: "float32x2"},
					],
				}
			],
		},

		fragment: {
			module: frag,
			entryPoint: "fs",
			targets: [{ format: targetFormat }],
		},
	};
	const fullOpts = Object.assign({}, baseOpts, pipelineOpts);
	const pipeline = device.createRenderPipeline(fullOpts);

	return pipeline;
}
