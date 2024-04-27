export default (device, usage, data) => {
	if (data.byteLength % 4 !== 0) {
		console.warn("Performance: Needed to pad buffer!");
		const temp = new Uint8Array(data.buffer);
		const foo  = new Uint8Array(data.byteLength + (data.byteLength % 4));

		for (let i = 0; i < temp.length; i++) {
			foo[i] = temp[i];
		}

		data = foo;
	}

	const buf = device.createBuffer({
		size:  data.byteLength,
		usage: usage,
	});

	device.queue.writeBuffer(buf, 0, data);
	return buf;
};

