/* promise */
exports.to = function (promise) {
	return promise
		.then((data) => {
			return [null, data];
		})
		.catch((err) => [err]);
};

exports.asyncForEach = async function (array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
};

exports.objectFromPath = function (obj, path, value = null) {
	if (typeof path === 'string') path = path.split('.');
	if (!Array.isArray(path)) throw new Error('path should be type of string or array');

	if (Object.prototype.toString.call(obj) != '[object Object]') throw new Error('obj should be an object');

	let current = obj;
	while (path.length > 1) {
		const [head, ...tail] = path;
		path = tail;
		if (current[head] === undefined) {
			current[head] = {};
		}
		current = current[head];
	}
	current[path[0]] = value;
	return obj;
};
