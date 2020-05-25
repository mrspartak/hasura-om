/* Promise */
exports.to = function (promise) {
	return promise
		.then((data) => {
			return [null, data];
		})
		.catch((error) => [error]);
};

exports.asyncForEach = async function (array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
};

exports.sleep = function (ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

exports.objectFromPath = function (object, path, value = null) {
	if (typeof path === 'string') {
		path = path.split('.');
	}

	if (!Array.isArray(path)) {
		throw new TypeError('path should be type of string or array');
	}

	if (Object.prototype.toString.call(object) !== '[object Object]') {
		throw new Error('obj should be an object');
	}

	let current = object;
	while (path.length > 1) {
		const [head, ...tail] = path;
		path = tail;
		if (current[head] === undefined) {
			current[head] = {};
		}

		current = current[head];
	}

	current[path[0]] = value;
	return object;
};

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
exports.mergeDeep = function (target, ...sources) {
	if (sources.length === 0) {
		return target;
	}

	const source = sources.shift();

	if (exports.isObject(target) && exports.isObject(source)) {
		for (const key in source) {
			if (exports.isObject(source[key])) {
				if (!target[key]) {
					Object.assign(target, {[key]: {}});
				}

				exports.mergeDeep(target[key], source[key]);
			} else {
				Object.assign(target, {[key]: source[key]});
			}
		}
	}

	return exports.mergeDeep(target, ...sources);
};

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
exports.isObject = function (item) {
	return item && typeof item === 'object' && !Array.isArray(item);
};
