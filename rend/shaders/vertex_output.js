export default `
struct vertex_output {
	@builtin(position) position: vec4f,
	@location(1)       normal:   vec3f,
	@location(2)       color:    vec3f,
	@location(3)       texcoord: vec2f,
};
`;
