require('dotenv').config();
const test = require('ava');
const {Hasura} = require('../src');

test.before(async (t) => {
	const orm = new Hasura({
		graphqlUrl: process.env.GQL_ENDPOINT,
		adminSecret: process.env.GQL_SECRET,
	});
	await orm.init();

	t.context.orm = orm;
});

test.serial('test first reply', (t) => {
	const orm = t.context.orm;

	return new Promise((resolve) => {
		const unsub = orm.subscribe(
			{
				_om_test: {},
			},
			([err, data]) => {
				t.is(err, null);
				t.true(Array.isArray(data));

				resolve();
			},
		);
	});
});

test.serial('test aggregate', (t) => {
	const orm = t.context.orm;

	return new Promise((resolve) => {
		const unsub = orm.subscribe(
			{
				_om_test: {
					aggregate: {
						count: {},
					},
				},
			},
			([err, data]) => {
				t.is(err, null);
				t.true(typeof data.count === 'number');

				resolve();
			},
		);
	});
});

test.serial('should throw an error', (t) => {
	const orm = t.context.orm;

	const [err, response] = orm.subscribe({
		fields: 123,
	});

	t.true(err instanceof Error);
});

test.serial('test error reply', (t) => {
	const orm = t.context.orm;

	return new Promise((resolve) => {
		const unsub = orm.subscribe(
			{
				_om_test: {
					where: {
						id: {
							_eq: 'ses',
						},
					},
				},
			},
			([err, data]) => {
				t.is(data, undefined);
				t.not(err, null);
				t.true(typeof err.message === 'string');

				resolve();
			},
		);
	});
});

test.serial('test sub', async (t) => {
	const orm = t.context.orm;

	const [err, response] = await orm.mutate({
		_om_test: {
			insert: {
				objects: {
					text: 'test_sub',
					increment: 15,
				},
			},
		},
	});
	if (err) {
		throw err;
	}

	const id = response[0].id;

	let responseCount = 0;
	return new Promise((resolve) => {
		t.timeout(5000);

		setInterval(async () => {
			if (responseCount === 1) {
				await orm.mutate({
					_om_test: {
						update: {
							where: {
								id: {
									_eq: id,
								},
							},
							_inc: {
								increment: 10,
							},
						},
					},
				});
			}
		}, 500);

		const unsub = orm.subscribe(
			{
				_om_test: {
					where: {
						id: {
							_eq: id,
						},
					},
				},
			},
			([err, data]) => {
				t.is(err, null);
				t.true(Array.isArray(data));
				t.is(data[0].text, 'test_sub');

				t.is(data[0].increment, 15 + responseCount * 10);
				responseCount++;

				if (responseCount >= 2) {
					resolve();
				}
			},
		);
	});
});
