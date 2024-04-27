"use strict";

import {matrix, mat4} from "./matrix.js";

// t. https://vincent-p.github.io/posts/vulkan_perspective_matrix/
// modified for normal (not reversed) depth from 0 to 1
// Math might not be right?
export function perspective(fovy, aspect, near, far) {
	const focal_len = 1.0 / Math.tan(fovy / 2.0);
	const x =  focal_len / aspect;
	const y =  focal_len;
	const A = -far / (far - near);
	const B =  near * A;

	return new matrix(4, 4,
		x, 0,  0, 0,
		0, y,  0, 0,
		0, 0,  A, B,
		0, 0, -1, 0
	);
}

export function translation(val /* vec3 */) {
	let ret = new matrix(4, 4);
	ret.data[3].x = val.x;
	ret.data[3].y = val.y;
	ret.data[3].z = val.z;
	return ret;
}

export function scale(val /* vec3 */) {
	return new matrix(4, 4,
		val.x, 0, 0, 0,
		0, val.y, 0, 0,
		0, 0, val.z, 0,
		0, 0, 0, 1,
	);
}

const cos = Math.cos;
const sin = Math.sin;

export function rotateX(amt) {
	return new mat4(
		1, 0, 0, 0,
		0, cos(amt), -sin(amt), 0,
		0, sin(amt),  cos(amt), 0,
		0, 0, 0, 1
	);
}

export function rotateY(amt) {
	return new mat4(
		 cos(amt), 0, sin(amt), 0,
		0, 1, 0, 0,
		-sin(amt), 0, cos(amt), 0,
		0, 0, 0, 1
	);
}

export function rotateZ(amt) {
	return new mat4(
		cos(amt), -sin(amt), 0, 0,
		sin(amt),  cos(amt), 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);
}
