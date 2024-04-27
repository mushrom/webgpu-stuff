import M3D from "../math3d/math.js";

export default class SceneNode {
	constructor() {
		this.name   = ""
		this.matrix = new M3D.mat4();

		this.position = new M3D.vec3();
		this.scale    = new M3D.vec3(1, 1, 1);
		this.rotation = new M3D.quat();

		this.isStatic = false;
		this.parent = null;
		this.children = [];
		this.components = {};
		this.renderState = {
			buffers:    {},
			bindGroups: {},
		};

		this.needsUpdate = true;
	}

	add(...nodes) {
		for (let node of nodes) {
			if (node.parent) {
				// TODO: remove
			}

			this.children.push(node);
			node.parent = this;
		}
	}

	setPosition(pos) {
		this.position = pos;
		this.needsUpdate = true;
	}

	setRotation(rot) {
		this.rotation = rot;
		this.needsUpdate = true;
	}

	setScale(scale) {
		this.scale = scale;
		this.needsUpdate = true;
	}

	setMatrix(matrix) {
		// TODO: decompose matrix
		this.matrix = matrix;
		this.needsUpdate = false;
	}

	updateMatrix() {
		if (!this.needsUpdate) {
			return;
		}

		this.needsUpdate = false;
		this.matrix = M3D.translation(this.position)
		    .multiply(this.rotation.toMat4())
		    .multiply(M3D.scale(this.scale));
	}
}
