require('dotenv').config();
const test = require('ava');
const Sql = require('../src/hasura/sql');

test('throws without params', (t) => {
	t.throws(
		() => {
			const request = new Sql();
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			const request = new Sql({
				queryUrl: 123,
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			const request = new Sql({
				queryUrl: process.env['GQL_ENDPOINT'].replace('/v1/graphql', '/v1/query'),
			});
		},
		{ instanceOf: Error },
	);
});

test('failed query', async (t) => {
	const request = new Sql({
		queryUrl: '123',
		adminSecret: '123',
	});

	var [err, data] = await request.run('123');
	t.true(err instanceof Error);
	t.is(data, undefined);
});

test('success query', async (t) => {
	const request = new Sql({
		queryUrl: process.env['GQL_ENDPOINT'].replace('/v1/graphql', '/v1/query'),
		adminSecret: process.env['GQL_SECRET'],
	});

	var [err, data] = await request.run('SELECT 1 as test');
	t.is(err, null);
	t.deepEqual(data, [{ test: '1' }]);
});
