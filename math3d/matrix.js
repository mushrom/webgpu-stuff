"use strict";

import {vec} from "./vec.js";

export class matrix {
	constructor(columns, rows) {
		this.data = [...new Array(columns).keys()].map(v => new vec(rows));
		this.columns  = columns;
		this.rows     = rows;
		this.isMatrix = true;

		for (let c = 0; c < columns && c < rows; c++) {
			this.data[c].data[c] = 1;
		}

		if (arguments.length > 2) {
			let offColumn = 0;
			let offRow = 0;

			const addData = (v) => {
				this.data[offColumn].data[offRow] = v;
				offColumn++;

				if (offColumn >= columns) {
					offColumn = 0;
					offRow++;
				}
			}

			for (let i = 2; i < arguments.length; i++) {
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
					addData(v);
				}
			}
		}
	}

	toArray(arr, offset = 0) {
		let meh = 0;

		for (let c = 0; c < this.columns; c++) {
			const col = this.data[c];

			for (let i = 0; i < col.size; i++) {
				arr[offset + meh + i] = col.data[i];
			}
			
			meh += col.size;
		}
	}

	fromArray(arr, offset = 0) {
		let meh = 0;

		for (let c = 0; c < this.columns; c++) {
			const col = this.data[c];

			for (let i = 0; i < col.size; i++) {
				col.data[i] = arr[offset + meh + i];
			}
			
			meh += col.size;
		}
	}

	multiply(v) {
		if (v.isMatrix) {
			return this.multiplyMatrix(v);

		} else if (v.isVec) {
			return this.multiplyVec(v);

		} else {
			// TODO: scalar?
			console.error("Invalid matrix multiply");
			return this;
		}
	}

	multiplyMatrix(B) {
		const A = this;

		if (B.rows !== A.columns) {
			throw `Incompatible matrix dimensions: ${A.colummns}x${A.rows}, ${B.columns}x${B.rows}`;
		}

		let ret = new matrix(B.columns, A.rows);

		for (let col = 0; col < ret.columns; col++) {
			for (let row = 0; row < ret.rows; row++) {
				let val = 0;

				for (let k = 0; k < A.columns; k++) {
					val += A.data[k].data[row] * B.data[col].data[k];
				}

				ret.data[col].data[row] = val;
			}
		}

		return ret;
	}

	multiplyVec(v) {
		if (v.size !== this.columns) {
			throw `Incompatible matrix dimensions: ${this.colummns}x${this.rows}, 1x${m.rows}`;
		}

		let ret = new vec(this.rows);

		for (let col = 0; col < this.columns; col++) {
			for (let row = 0; row < this.rows; row++) {
				ret.data[row] += v.data[col] * this.data[col].data[row];
			}
		}

		return ret;
	}

	transpose() {
		let ret = new matrix(this.rows, this.columns);

		for (let col = 0; col < this.columns; col++) {
			for (let row = 0; row < this.rows; row++) {
				ret.data[row].data[col] = this.data[col].data[row];
			}
		}

		return ret;
	}

	toString() {
		return `matrix${this.columns}x${this.rows} (${this.data.map(v => v.toString()).join(", ")})`;
	}
}

export class mat2 extends matrix {
	constructor() {
		super(2, 2, ...arguments);
	}
}

export class mat3 extends matrix {
	constructor() {
		super(3, 3, ...arguments);
	}
}

export class mat4 extends matrix {
	constructor() {
		super(4, 4, ...arguments);
	}
}
