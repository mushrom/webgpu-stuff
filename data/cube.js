export default function makeCuboid(width = 1, height = 1, depth = 1) {
	const ax = width  / 2;
	const ay = height / 2;
	const az = depth  / 2;

	const verts     = [];
	const indices   = [];
	const texcoords = [];

	const uvs = [
		[0, 0], [1, 0],
		[1, 1], [0, 1],
	];

	const vertData = [
		// front
		[-ax, -ay,  az], [ ax, -ay,  az],
		[ ax,  ay,  az], [-ax,  ay,  az],
		// top
		[-ax,  ay,  az], [ ax,  ay,  az],
		[ ax,  ay, -az], [-ax,  ay, -az],
		// back
		[ ax, -ay, -az], [-ax, -ay, -az],
		[-ax,  ay, -az], [ ax,  ay, -az],
		// bottom
		[-ax, -ay, -az], [ ax, -ay, -az],
		[ ax, -ay,  az], [-ax, -ay,  az],
		// left
		[-ax, -ay, -az], [-ax, -ay,  az],
		[-ax,  ay,  az], [-ax,  ay, -az],
		// right
		[ ax, -ay,  az], [ ax, -ay, -az],
		[ ax,  ay, -az], [ ax,  ay,  az],
	];

	for (let i = 0; i < 24; i++) {
		for (let k = 0; k < 3; k++) {
			verts.push(vertData[i][k]);
		}

		for (let k = 0; k < 2; k++) {
			texcoords.push(uvs[i & 3][k]);
		}
	}

	for (let i = 0; i < 24; i += 4) {
		indices.push(i);
		indices.push(i+1);
		indices.push(i+2);
		indices.push(i+2);
		indices.push(i+3);
		indices.push(i);
	}

	return {
		indices:   indices,
		positions: verts,
		texcoords: texcoords,
	};
}
