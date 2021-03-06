require('dotenv').config();
const test = require('ava');
const {Hasura} = require('../src');
const __ = require('../src/utils/helpers');

test.before(async (t) => {
	const orm = new Hasura({
		graphqlUrl: process.env.GQL_ENDPOINT,
		adminSecret: process.env.GQL_SECRET,
	});
	await orm.generateTablesFromAPI();

	t.context.orm = orm;
});

test.after(async (t) => {
	await __.sleep(1000);

	const [err, response] = await t.context.orm.mutate({
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
	t.is(err, null);
	t.is(typeof response._om_test, 'object');
	t.is(typeof response._om_test_types, 'object');
});

test.serial('test tables existing', (t) => {
	const orm = t.context.orm;

	t.is(typeof orm.tables._om_test, 'object');
	t.is(typeof orm.tables._om_test_types, 'object');
});

test.serial('test option flatOne', async (t) => {
	const orm = t.context.orm;

	var [err, response] = await orm.query({
		_om_test: {},
	});
	t.is(err, null);
	t.true(Array.isArray(response));

	var [err, response] = await orm.query(
		{
			_om_test: {},
		},
		{
			flatOne: false,
		},
	);
	t.is(err, null);
	t.true(Array.isArray(response._om_test.select));
});

test.serial('test option getFirst', async (t) => {
	const orm = t.context.orm;

	var [err, response] = await orm.query({
		_om_test: {},
	});
	t.is(err, null);

	t.true(Array.isArray(response));

	var [err, response] = await orm.query(
		{
			_om_test: {},
		},
		{
			getFirst: true,
		},
	);
	t.is(err, null);
	t.true(!Array.isArray(response));

	var [err, response] = await orm.query(
		{
			_om_test: {},
		},
		{
			flatOne: false,
			getFirst: true,
		},
	);
	t.is(err, null);
	t.true(!Array.isArray(response._om_test));

	var [err, response] = await orm.query(
		{
			_om_test: {},
			_om_test_types: {},
		},
		{
			getFirst: true,
		},
	);
	t.is(err, null);
	t.true(!Array.isArray(response._om_test));
	t.true(!Array.isArray(response._om_test_types));
});

test.serial('add records with transaction', async (t) => {
	const orm = t.context.orm;

	/*
		Note!
		By default all selects are only on base table fields,
		so nested object is created, but not returned
		until you define a fragment or whole scheme to return
	*/
	const [err, response] = await orm.mutate({
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
	t.is(err, null);

	t.is(response._om_test[0].text, 'test');
	t.is(response._om_test[0].type, 'some_type');

	t.is(response._om_test_types[0].type, 'another_type');
});

test.serial('return nested data with custom scheme', async (t) => {
	const orm = t.context.orm;

	const [err, response] = await orm.mutate({
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
	t.is(err, null);

	/*
		Note!
		Relationship here is N - 1, so we directly accessing description
	*/
	t.is(response[0].types.description, 'this is good type');
});

test.serial('insert and update', async (t) => {
	const orm = t.context.orm;

	const [err, response] = await orm.mutate({
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
	t.is(err, null);

	t.is(err, null);
	t.is(typeof response, 'object');

	t.is(response.insert[0].text, 'test 3');
	t.is(response.insert[0].type, null);

	t.is(response.update[0].type, 'some_type_2');
	t.is(response.update[0].text, 'changed');
	t.is(response.update[0].increment, 10);
});

test.serial('failing transaction', async (t) => {
	const orm = t.context.orm;

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
	t.is(err, null);

	/*
		Note!
		By default if only 1 table is used
		the table key will be flatened
		so response is avialable just in variable
	*/
	t.is(response.length, 0);
});

test.serial('error building query', async (t) => {
	const orm = t.context.orm;

	var [err, response] = await orm.query({
		fields: 123,
	});

	t.true(err instanceof Error);

	var [err, response] = await orm.mutate({
		fields: 123,
	});

	t.true(err instanceof Error);
});

test.serial('simple add/update row', async (t) => {
	const orm = t.context.orm;

	var [err, response] = await orm.mutate({
		_om_test: {
			insert: {
				objects: {
					text: 'test 3',
				},
			},
		},
	});
	t.is(err, null);

	t.is(typeof response, 'object');
	t.true(Array.isArray(response));
	t.true(typeof response[0].id === 'number');

	// Add row with returning object instead of one element array
	var [err, response] = await orm.mutate(
		{
			_om_test: {
				insert: {
					objects: {
						text: 'test 3',
					},
				},
			},
		},
		{getFirst: true},
	);
	t.is(err, null);

	t.is(typeof response, 'object');
	t.true(typeof response.id === 'number');

	const ID = response.id;

	var [err, response] = await orm.mutate({
		_om_test: {
			update: {
				where: {id: {_eq: ID}},
				_set: {text: 'test_123123'},
			},
		},
	});
	t.is(err, null);

	t.is(typeof response, 'object');
	t.true(Array.isArray(response));
	t.is(response[0].text, 'test_123123');

	var [err, response] = await orm.mutate(
		{
			_om_test: {
				update: {
					where: {id: {_eq: ID}},
					_set: {text: 'test_123213123123'},
				},
			},
		},
		{getFirst: true},
	);
	t.is(err, null);

	t.is(typeof response, 'object');
	t.is(response.text, 'test_123213123123');
});

test.serial('queries with user role', async (t) => {
	const orm = t.context.orm;

	// Base fragment has type field in it
	var [err, response] = await orm.query(
		{
			_om_test: {},
		},
		{},
		{
			headers: {
				'X-Hasura-User-ID': 1,
				'X-Hasura-Role': 'user',
			},
		},
	);
	t.is(err.message, 'field "type" not found in type: \'_om_test\'');
	t.is(response, undefined);

	var [err, response] = await orm.query(
		{
			_om_test: {
				fields: ['id'],
			},
		},
		{},
		{
			headers: {
				'X-Hasura-User-ID': 1,
				'X-Hasura-Role': 'user',
			},
		},
	);
	t.is(err, null);
	t.true(response.length > 0);

	// Base fragment has type field in it
	var [err, response] = await orm.mutate(
		{
			_om_test: {
				insert: {
					objects: {
						text: 'test 4',
					},
				},
			},
		},
		{},
		{
			headers: {
				'X-Hasura-User-ID': 1,
				'X-Hasura-Role': 'user',
			},
		},
	);
	t.is(err.message, 'no mutations exist');
});
