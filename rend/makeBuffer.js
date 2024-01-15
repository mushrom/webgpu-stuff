export default (device, usage, data) => {
	const buf = device.createBuffer({
		size:  data.byteLength,
		usage: usage,
	});

	device.queue.writeBuffer(buf, 0, data);
	return buf;
};

