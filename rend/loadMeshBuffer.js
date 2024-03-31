import makeBuffer from "./makeBuffer.js";

export default (device, data) => {
	const vertSize = 4*4 + 2;
	const numVerts = data.positions.length / 3;
	const vertData  = new Float32Array(numVerts * vertSize);
	const indexData = new Uint16Array(data.indices.length);

	const kPosition = 0;
	const kNormal   = 4;
	const kTangent  = 8;
	const kColor    = 12;
	const kTexCoord = 16;

	for (let i = 0; i < numVerts; i++) {
		for (let k = 0; k < 3; k++) {
			vertData[i*vertSize + k + kPosition] = data.positions[3*i + k];
			vertData[i*vertSize + k + kNormal]   = 0;
			vertData[i*vertSize + k + kTangent]  = 0;
			vertData[i*vertSize + k + kColor]    = 0;
		}

		if (data.texcoords) {
			for (let k = 0; k < 2; k++) {
				vertData[i*vertSize + k + kTexCoord] = data.texcoords[2*i + k];
			}
		} else {
			for (let k = 0; k < 2; k++) {
				vertData[i*vertSize + k + kTexCoord] = data.positions[2*i + k];
			}
		}
	}

	for (let i = 0; i < data.indices.length; i++) {
		indexData[i] = data.indices[i];
	}

	const copydest  = GPUBufferUsage.COPY_DST;
	const vertexBuf = makeBuffer(device, GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | copydest, vertData);
	const indexBuf  = makeBuffer(device, GPUBufferUsage.INDEX  | copydest, indexData);

	return {
		vertexBuf:  vertexBuf,
		indexBuf:   indexBuf,
		numIndices: data.indices.length,
	};
}

