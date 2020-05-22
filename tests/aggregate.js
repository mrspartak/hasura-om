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

test.serial('simple aggregate test', async (t) => {
	let orm = t.context.orm;

	var [err, response] = await orm.query({
		_om_test: {
			aggregate: {
				count: {},
			},
		},
	});
	if (err) throw err;
	t.true(typeof response.aggregate.count == 'number');

	//if only one table requested it will be flated by default
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
	if (err) throw err;
	t.true(typeof response._om_test.aggregate.count == 'number');
});

test.serial('aggregate with query', async (t) => {
	let orm = t.context.orm;

	var [err, response] = await orm.query({
		_om_test: {
			select: {},
			aggregate: {
				count: {},
			},
		},
	});
	if (err) throw err;
	/* 
		response: {
			aggregate: {
				count: [Number]
			},
			select: [{
				...baseFragmentFields
			}]
		}
	*/
	t.true(typeof response.aggregate.count == 'number');
	t.true(Array.isArray(response.select));
});

test.serial('aggregate query test', async (t) => {
	let orm = t.context.orm;

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
		some aggr functions test
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
	if (err) throw err;

	t.is(response.aggregate.count, 3);
	t.is(response.aggregate.sum.increment, 18);
	t.is(response.aggregate.min.increment, 3);
	t.is(response.aggregate.max.increment, 10);
	t.is(response.aggregate.avg.increment, 6);

	/* 
		count distinct test
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
	if (err) throw err;

	t.is(response.aggregate.count, 1);
});
