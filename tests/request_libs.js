require('dotenv').config();
const test = require('ava');
const Sql = require('../src/hasura/sql');
const Gql = require('../src/hasura/gql');
const Wsgql = require('../src/hasura/wsgql');

test('Sql throws without params', (t) => {
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

test('Sql failed query', async (t) => {
	const request = new Sql({
		queryUrl: '123',
		adminSecret: '123',
	});

	var [err, data] = await request.run('123');
	t.true(err instanceof Error);
	t.is(data, undefined);
});

test('Sql success query', async (t) => {
	const request = new Sql({
		queryUrl: process.env['GQL_ENDPOINT'].replace('/v1/graphql', '/v1/query'),
		adminSecret: process.env['GQL_SECRET'],
	});

	var [err, data] = await request.run('SELECT 1 as test');
	t.is(err, null);
	t.deepEqual(data, [{ test: '1' }]);
});

test('Gql throws without params', (t) => {
	t.throws(
		() => {
			const request = new Gql();
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			const request = new Gql({
				graphqlUrl: 123,
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			const request = new Gql({
				graphqlUrl: process.env['GQL_ENDPOINT'],
			});
		},
		{ instanceOf: Error },
	);
});

test('Gql failed query', async (t) => {
	const request = new Gql({
		graphqlUrl: '123',
		adminSecret: '123',
	});

	var [err, data] = await request.run('123');
	t.true(err instanceof Error);
	t.is(data, undefined);
});

test('Gql failed query by hasura', async (t) => {
	const request = new Gql({
		graphqlUrl: process.env['GQL_ENDPOINT'],
		adminSecret: process.env['GQL_SECRET'],
	});

	var [err, data] = await request.run('123');
	t.true(err instanceof Error);
	t.is(data, undefined);
});

test('Gql success query', async (t) => {
	const request = new Gql({
		graphqlUrl: process.env['GQL_ENDPOINT'],
		adminSecret: process.env['GQL_SECRET'],
	});

	var [err, data] = await request.run({
		query: `
        query TestQuery {
            _om_test(limit: 1) {
              id
            }
          }
        `,
	});
	t.is(err, null);
	t.true(data._om_test.length >= 0);
});

test('Wsgql throws without params', (t) => {
	t.throws(
		() => {
			const request = new Wsgql();
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			const request = new Wsgql({
				wsUrl: 123,
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			const request = new Wsgql({
				wsUrl: process.env['GQL_ENDPOINT'].replace('http://', 'ws://').replace('https://', 'wss://'),
			});
		},
		{ instanceOf: Error },
	);

	const request = new Wsgql({
		wsUrl: process.env['GQL_ENDPOINT'].replace('http://', 'ws://').replace('https://', 'wss://'),
		adminSecret: '123',
	});

	t.throws(
		//1
		() => {
			request.run('123');
		},
		{ instanceOf: Error },
	);
	t.throws(
		//2
		() => {
			request.run({
				query: 123,
			});
		},
		{ instanceOf: Error },
	);
	t.throws(
		//3
		() => {
			request.run({
				query: '1123',
				callback: 123,
			});
		},
		{ instanceOf: Error },
	);
});

test('Wsgql failed query', async (t) => {
	const request = new Wsgql({
		wsUrl: process.env['GQL_ENDPOINT'].replace('http://', 'ws://').replace('https://', 'wss://'),
		adminSecret: process.env['GQL_SECRET'],
	});

	return new Promise((resolve) => {
		request.run({
			query: '123',
			callback([err, data]) {
				t.true(typeof err != 'undefined');
				t.is(data, undefined);

				return resolve();
			},
		});
	});
});

test('Wsgql success query', async (t) => {
	const request = new Wsgql({
		wsUrl: process.env['GQL_ENDPOINT'].replace('http://', 'ws://').replace('https://', 'wss://'),
		adminSecret: process.env['GQL_SECRET'],
	});

	return new Promise((resolve) => {
		request.run({
			query: `
             query TestQuery {
                _om_test(limit: 1) {
                  id
                }
              }
            `,
			callback([err, data]) {
				t.is(err, null);
				t.true(data._om_test.length >= 0);

				return resolve();
			},
		});
	});
});
