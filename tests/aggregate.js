require('dotenv').config();
const test = require('ava');
const {Hasura} = require('../src');

test.before(async (t) => {
	const orm = new Hasura({
		graphqlUrl: process.env.GQL_ENDPOINT,
		adminSecret: process.env.GQL_SECRET,
	});
	await orm.generateTablesFromAPI();

	t.context.orm = orm;
});

test.serial('simple aggregate test', async (t) => {
	const orm = t.context.orm;

	var [err, response] = await orm.query({
		_om_test: {
			aggregate: {
				count: {},
			},
		},
	});

	t.is(err, null);
	t.true(typeof response.count === 'number');

	// If only one table requested it will be flated by default
	var [err, response] = await orm.query(
		{
			_om_test: {
				aggregate: {
					count: {},
				},
			},
		},
		{
			flatOne: false,
		},
	);

	t.is(err, null);
	t.true(typeof response._om_test.aggregate.count === 'number');
});

test.serial('aggregate with query', async (t) => {
	const orm = t.context.orm;

	const [err, response] = await orm.query({
		_om_test: {
			select: {},
			aggregate: {
				count: {},
			},
		},
	});

	/*
		Response: {
			aggregate: {
				count: [Number]
			},
			select: [{
				...baseFragmentFields
			}]
		}
	*/
	t.is(err, null);
	t.true(typeof response.aggregate.count === 'number');
	t.true(Array.isArray(response.select));
});

test.serial('aggregate query test', async (t) => {
	const orm = t.context.orm;

	var [err, response] = await orm.mutate({
		_om_test: {
			delete: {
				where: {
					type: {
						_eq: 'AGG_TYPE_1',
					},
				},
			},
			insert: {
				objects: [
					{
						increment: 3,
						type: 'AGG_TYPE_1',
					},
					{
						increment: 5,
						type: 'AGG_TYPE_1',
					},
					{
						increment: 10,
						type: 'AGG_TYPE_1',
					},
				],
			},
		},
	});

	/*
		Some aggr functions test
	*/
	var [err, response] = await orm.query({
		_om_test: {
			aggregate: {
				where: {
					type: {
						_eq: 'AGG_TYPE_1',
					},
				},
				count: {},
				sum: ['increment'],
				min: ['increment'],
				max: ['increment'],
				avg: ['increment'],
			},
		},
	});

	t.is(err, null);
	t.is(response.count, 3);
	t.is(response.sum.increment, 18);
	t.is(response.min.increment, 3);
	t.is(response.max.increment, 10);
	t.is(response.avg.increment, 6);

	/*
		Count distinct test
	*/
	var [err, response] = await orm.query({
		_om_test: {
			aggregate: {
				where: {
					type: {
						_eq: 'AGG_TYPE_1',
					},
				},
				count: {
					columns: 'type',
					distinct: true,
				},
			},
		},
	});

	t.is(err, null);
	t.is(response.count, 1);
});
