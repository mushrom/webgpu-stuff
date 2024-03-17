import vertex_output from './vertex_output.js';

export default function vertex_model(device) {
	return device.createShaderModule({
		label: 'vertex shader (model)',
		code: `
			${vertex_output}

			struct vertex_input {
				@location(0) position: vec3f,
				@location(1) normal:   vec3f,
				@location(2) tangent:  vec3f,
				@location(3) color:    vec3f,
				@location(4) texcoord: vec2f,
			}

			struct Camera {
				projection: mat4x4f,
				view:       mat4x4f,
			};

			@group(0) @binding(0) var<uniform> cam: Camera;
			@group(2) @binding(0) var<uniform> model: mat4x4f;

			@vertex fn vs(vert: vertex_input)
				-> vertex_output
			{
				var output: vertex_output;

				//output.position = vec4f(vert.position, 1);
				output.position = cam.projection * cam.view * model * vec4f(vert.position, 1);
				output.normal   = vert.normal;
				//output.color    = vert.color;
				output.color    = vec3(1, 0, 0);
				output.texcoord = vert.texcoord;

				return output;
			}
		`,
	});
}
