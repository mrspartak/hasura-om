const test = require('ava');
const __ = require('../src/utils/helpers');
const builders = require('../src/utils/builders');

test('await to test', async (t) => {
	var [err, response] = await __.to(new Promise((resolve) => resolve('test')));
	t.is(err, null);
	t.is(response, 'test');

	var [err, response] = await __.to(new Promise((resolve, reject) => reject(new Error('test'))));
	t.true(err instanceof Error);
	t.is(err.message, 'test');
	t.is(response, undefined);
});

test('await for each', async (t) => {
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	let ts = new Date().getTime();

	await __.asyncForEach([1, 2, 3], async () => {
		await sleep(100);
	});

	let diff = new Date().getTime() - ts;
	t.true(diff >= 290, `passed ${diff} seconds`);
});

test('objectFromPath', (t) => {
	var testObject = __.objectFromPath({}, 'test');
	t.deepEqual(testObject, { test: null });

	var testObject = __.objectFromPath({ a: 1 }, 'test');
	t.deepEqual(testObject, { a: 1, test: null });

	var testObject = __.objectFromPath({ a: 1 }, 'test', 666);
	t.deepEqual(testObject, { a: 1, test: 666 });

	var testObject = __.objectFromPath({ a: 1 }, 'one.two.three', 666);
	t.deepEqual(testObject, { a: 1, one: { two: { three: 666 } } });

	t.throws(
		() => {
			__.objectFromPath({}, 123, 666);
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			__.objectFromPath({ a: 1 }, { a: 1 }, 666);
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			__.objectFromPath(123, 'test', 666);
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			__.objectFromPath([], 'test', 666);
		},
		{ instanceOf: Error },
	);
});

test('test gql field builder', (t) => {
	t.throws(
		() => {
			builders.fieldsToGql(123);
		},
		{ instanceOf: Error },
	);
});
