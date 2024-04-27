"use strict";

export class vec {
	constructor(size) {
		if (size <= 0)
			throw "Invalid vector size: " + size;

		this.size  = size;
		this.isVec = true;
		this.data  = [...new Array(size).keys()].map(v => 0);

		let fields = "xyzw";
		for (let i = 0; i < size; i++) {
			Object.defineProperty(this, fields[i], {
				get: ()  => this.data[i],
				set: (v) => this.data[i] = v,
			});
		}

		let offset = 0;
		const addData = (v) => {
			if (offset < size)
				this.data[offset++] = v;
		}

		for (let i = 1; i < arguments.length; i++) {
			let v = arguments[i];

			if (v instanceof Array && v.length) {
				for (let k = 0; k < v.length; k++) {
					addData(v[k]);
				}

			} else if (v instanceof vec) {
				for (let k = 0; k < v.size; k++) {
					addData(v.data[k]);
				}

			} else if (typeof v === 'number') {
				addData(arguments[i]);
			}
		}
	}

	toString() {
		return `[vec${this.size} (${this.data.join(", ")})]`;
	}

	checkDim(other) {
		if (this.size != other.size)
			throw `Incompatible vectors: ${this.size}, ${other.size}`;
	}

	copy(otherVec) {
		this.checkDim(otherVec);

		for (let i = 0; i < this.size; i++) {
			this.data[i] = otherVec.data[i];
		}

		return this;
	}

	dup() {
		return new vec(this.size).copy(this);
	}

	add(otherVec) {
		this.checkDim(otherVec);

		for (let i = 0; i < this.size; i++) {
			this.data[i] += otherVec.data[i];
		}

		return this;
	}

	sub(otherVec) {
		this.checkDim(otherVec);

		for (let i = 0; i < this.size; i++) {
			this.data[i] -= otherVec.data[i];
		}

		return this;
	}

	mult(otherVec) {
		this.checkDim(otherVec);

		for (let i = 0; i < this.size; i++) {
			this.data[i] *= otherVec.data[i];
		}

		return this;
	}

	div(otherVec) {
		this.checkDim(otherVec);

		for (let i = 0; i < this.size; i++) {
			this.data[i] /= otherVec.data[i];
		}

		return this;
	}

	dot(otherVec) {
		this.checkDim(otherVec);

		let ret = 0;

		for (let i = 0; i < this.size; i++) {
			ret += this.data[i] * otherVec.data[i];
		}

		return ret;
	}

	addScalar(v) {
		for (let i = 0; i < this.size; i++) {
			this.data[i] += v;
		}
	}

	subScalar(v) {
		for (let i = 0; i < this.size; i++) {
			this.data[i] -= v;
		}

		return this;
	}

	multScalar(v) {
		for (let i = 0; i < this.size; i++) {
			this.data[i] *= v;
		}

		return this;
	}

	divScalar(v) {
		for (let i = 0; i < this.size; i++) {
			this.data[i] /= v;
		}

		return this;
	}

	lengthSq() {
		let sum = 0;

		for (let i = 0; i < this.size; i++) {
			sum += this.data[i]*this.data[i];
		}

		return sum;
	}

	length() {
		let sum = 0;

		for (let i = 0; i < this.size; i++) {
			sum += this.data[i]*this.data[i];
		}

		return Math.sqrt(sum);
	}

	normalize() {
		this.divScalar(this.length());
		return this;
	}

	cross(b) {
		if (this.size !== 3)
			throw "cross() only supported for 3-dimensional vectors at the moment";

		const a = this;

		return new vec(this.size,
			a.y*b.z - a.z*b.y,
			a.z*b.x - a.x*b.z,
			a.x*b.y - a.y*b.x
		);
	}
}

export class vec2 extends vec {
	constructor() {
		super(2, ...arguments);
	}
}

export class vec3 extends vec {
	constructor() {
		super(3, ...arguments);
	}
}

export class vec4 extends vec {
	constructor() {
		super(4, ...arguments);
	}
}
