import vertex_output from './vertex_output.js';

export default function fragment_unshaded(device) {
	return device.createShaderModule({
		label: 'fragment shader (unshaded)',
		code: `
			${vertex_output}

			@group(0) @binding(1) var mainSampler: sampler;
			@group(1) @binding(0) var texAlbedo  : texture_2d<f32>;

			@fragment fn fs(frag_input: vertex_output) -> @location(0) vec4f {
				var albedo = textureSample(texAlbedo, mainSampler, frag_input.texcoord);
				//return vec4f(frag_input.color, 1.0);
				return vec4f(albedo.xyz, 1.0);
				//return vec4f(frag_input.texcoord, 0.0, 1.0);
			}
		`,
	});
}
