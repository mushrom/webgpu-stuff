"use strict";

import {vec3, vec4} from "./vec.js";
import {mat3, mat4} from "./matrix.js";

export class quat extends vec4 {
	constructor() {
		if (arguments.length > 0) {
			super(...arguments);
		} else {
			super(0, 0, 0, 1);
		}
	}

	// t. https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation#Quaternion-derived_rotation_matrix
	toMat3() {
		const q = {
			i: this.x,
			j: this.y,
			k: this.z,
			r: this.w,
		};

		return new mat3(
			1 - 2*(q.j*q.j + q.k*q.k), 2*(q.i*q.j - q.k*q.r),     2*(q.i*q.k + q.j*q.r),
			2*(q.i*q.j + q.k*q.r),     1 - 2*(q.i*q.i + q.k*q.k), 2*(q.j*q.k - q.i*q.r),
			2*(q.i*q.k - q.j*q.r),     2*(q.j*q.k + q.i*q.r),     1 - 2*(q.i*q.i + q.j*q.j),
		);
	}

	toMat4() {
		const q = {
			i: this.x,
			j: this.y,
			k: this.z,
			r: this.w,
		};

		return new mat4(
			1 - 2*(q.j*q.j + q.k*q.k), 2*(q.i*q.j - q.k*q.r),     2*(q.i*q.k + q.j*q.r),     0,
			2*(q.i*q.j + q.k*q.r),     1 - 2*(q.i*q.i + q.k*q.k), 2*(q.j*q.k - q.i*q.r),     0,
			2*(q.i*q.k - q.j*q.r),     2*(q.j*q.k + q.i*q.r),     1 - 2*(q.i*q.i + q.j*q.j), 0,
			0,                         0,                         0,                         1
		);
	}

	fromAxisAngle(axis /* vec3 */, angle /* radians */) {
		let c = Math.cos(angle/2);
		let s = Math.sin(angle/2);

		let temp = new vec3().copy(axis).multScalar(s);

		this.x = temp.x;
		this.y = temp.y;
		this.z = temp.z;
		this.w = c;

		return this;
	}

	multiply(other) {
		const q1 = this;
		const q2 = other;

		const tx = q1.x*q2.y + q1.y*q2.x + q1.z*q2.w - q1.w*q2.z;
		const ty = q1.x*q2.z - q1.y*q2.w + q1.z*q2.x + q1.w*q2.y;
		const tz = q1.x*q2.w + q1.y*q2.z - q1.z*q2.y + q1.w*q2.x;
		const tw = q1.x*q2.x - q1.y*q2.y - q1.z*q2.z - q1.w*q2.w;

		this.x = tx;
		this.y = ty;
		this.z = tz;
		this.w = tw;

		return this;
	}
}
