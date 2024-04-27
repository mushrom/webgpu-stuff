import M3D from "../math3d/math.js";
import SceneNode from "./SceneNode.js";

export default class Camera extends SceneNode {
	constructor() {
		super();

		this.basisForward = new M3D.vec3(0, 0, -1);
		this.basisUp      = new M3D.vec3(0, 1,  0);
		this.basisRight   = new M3D.vec3(1, 0,  0);

		this.forward = this.basisForward;
		this.up      = this.basisUp;
		this.right   = this.basisRight;
	}

	updateMatrix() {
		if (!this.needsUpdate) {
			return;
		}

		this.needsUpdate = false;

		const rot = this.rotation.toMat4().transpose();
		const pos = M3D.translation(new M3D.vec3().copy(this.position).multScalar(-1))

		const hmm = this.rotation.toMat3();
		this.forward = hmm.multiply(this.basisForward);
		this.up      = hmm.multiply(this.basisUp);
		this.right   = hmm.multiply(this.basisRight);

		this.matrix = rot.multiply(pos);
	}
}

