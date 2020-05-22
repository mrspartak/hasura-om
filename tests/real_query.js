require('dotenv').config();
const test = require('ava');
const { Hasura } = require('../src/');

test.before(async (t) => {
	const orm = new Hasura({
		graphqlUrl: process.env['GQL_ENDPOINT'],
		adminSecret: process.env['GQL_SECRET'],
	});
	await orm.init();

	t.context.orm = orm;
});

test.serial('test tables existing', (t) => {
	let orm = t.context.orm;

	t.is(typeof orm.tables._om_test, 'object');
	t.is(typeof orm.tables._om_test_types, 'object');
});

test.serial('delete all records', async (t) => {
	let orm = t.context.orm;

	var [err, response] = await orm.mutate({
		_om_test: {
			delete: {
				where: {},
			},
		},
		_om_test_types: {
			delete: {
				where: {},
			},
		},
	});
	if (err) throw err;

	t.is(typeof response._om_test.delete, 'object');
	t.is(typeof response._om_test_types.delete, 'object');

	//ensure that no rows exist
	var [err, response] = await orm.query({
		_om_test: {},
		_om_test_types: {},
	});
	if (err) throw err;

	t.is(response._om_test.length, 0);
	t.is(response._om_test_types.length, 0);
});

test.serial('test option flatOne', async (t) => {
	let orm = t.context.orm;

	var [err, response] = await orm.query({
		_om_test: {},
	});
	if (err) throw err;

	t.true(Array.isArray(response));

	var [err, response] = await orm.query(
		{
			_om_test: {},
		},
		{
			flatOne: false,
		},
	);
	if (err) throw err;

	t.true(Array.isArray(response._om_test.select));
});

test.serial('add records with transaction', async (t) => {
	let orm = t.context.orm;

	/* 
		Note! 
		By default all selects are only on base table fields, 
		so nested object is created, but not returned 
		until you define a fragment or whole scheme to return
	*/
	var [err, response] = await orm.mutate({
		_om_test: {
			insert: {
				objects: {
					text: 'test',
					types: {
						data: {
							type: 'some_type',
							description: 'this is good type',
						},
					},
				},
			},
		},
		_om_test_types: {
			insert: {
				objects: {
					type: 'another_type',
				},
			},
		},
	});
	if (err) throw err;

	t.is(response._om_test.insert[0].text, 'test');
	t.is(response._om_test.insert[0].type, 'some_type');

	t.is(response._om_test_types.insert[0].type, 'another_type');
});

test.serial('return nested data with custom scheme', async (t) => {
	let orm = t.context.orm;

	var [err, response] = await orm.mutate({
		_om_test: {
			insert: {
				objects: {
					text: 'test 2',
					types: {
						data: {
							type: 'some_type_2',
							description: 'this is good type',
						},
					},
				},
				fields: `
					id
					types {
						description
					}
				`,
			},
		},
	});
	if (err) throw err;

	/* 
		Note!
		Relationship here is N - 1, so we directly accessing description
	*/
	t.is(response._om_test.insert[0].types.description, 'this is good type');
});

test.serial('insert and update', async (t) => {
	let orm = t.context.orm;

	var [err, response] = await orm.mutate({
		_om_test: {
			insert: {
				objects: {
					text: 'test 3',
				},
			},
			update: {
				where: {
					type: {
						_eq: 'some_type_2',
					},
				},
				_set: {
					text: 'changed',
				},
				_inc: {
					increment: 10,
				},
			},
		},
	});
	if (err) throw err;

	t.is(err, null);
	t.is(typeof response, 'object');

	t.is(response._om_test.insert[0].text, 'test 3');
	t.is(response._om_test.insert[0].type, null);

	t.is(response._om_test.update[0].type, 'some_type_2');
	t.is(response._om_test.update[0].text, 'changed');
	t.is(response._om_test.update[0].increment, 10);
});

test.serial('failing transaction', async (t) => {
	let orm = t.context.orm;

	var [err, response] = await orm.mutate({
		_om_test: {
			insert: {
				objects: {
					text: 'will not exist',
				},
			},
			update: {
				where: {
					type: {
						_eq: 'some_type_2',
					},
				},
				_inc: {
					increment: -100,
				},
			},
		},
	});

	t.true(err instanceof Error);

	var [err, response] = await orm.query({
		_om_test: {
			where: {
				text: {
					_eq: 'will not exist',
				},
			},
		},
	});
	if (err) throw err;

	/* 
		Note!
		By default if only 1 table is used
		the table key will be flatened 
		so response is avialable just in variable
	*/
	t.is(response.length, 0);
});

test.serial('error building query', async (t) => {
	let orm = t.context.orm;

	var [err, response] = await orm.query({
		fields: 123,
	});

	t.true(err instanceof Error);

	var [err, response] = await orm.mutate({
		fields: 123,
	});

	t.true(err instanceof Error);
});
