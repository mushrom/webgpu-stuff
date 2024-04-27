const makeTestTexture = () => {
	const data = [];

	for (let x = 0; x < 32; x++) {
		for (let y = 0; y < 32; y++) {
			const val = (x^y) << 3;
			data.push([val, 0, val, 255]);
			//data.push([x << 3, y << 3, val, 255]);
			//data.push([x << 3, y << 3, 0, 255]);
		}
	}

	return {
		width: 32,
		height: 32,
		data: new Uint8Array(data.flat()),
	};
};

const testTexData = makeTestTexture();
export default () => {
	return {
		albedo:     testTexData,
		normal:     null, // TODO
		metalrough: null, // TODO
		emissive:   null, // TODO
		occlusion:  null, // TODO
	};
}
