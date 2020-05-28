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

test('nested draft', async (t) => {
	const orm = t.context.orm;

	var [err] = await orm.mutate({
		_om_test: {
			delete: {
				where: {type: {_eq: 't2chNestedArgs'}},
			},
		},
		_om_test_types: {
			delete: {
				where: {type: {_eq: 't2chNestedArgs'}},
			},
			insert: {
				objects: {
					type: 't2chNestedArgs',
					objects: {
						data: [
							{
								increment: 1,
								text: 'test',
							},
							{
								increment: 2,
								text: 'test2',
							},
						],
					},
				},
			},
		},
	});
	t.is(err, null);

	const baseTestFragment = orm.table('_om_test').fragment('base');

	orm.table('_om_test_types').createFragment('nested', [
		'type',
		[
			'objects',
			[baseTestFragment],
			{
				_table: '_om_test',
				limit: 'objects_limit',
				where: 'objects_where',
			},
		],
	]);

	var [err, response] = await orm.query({
		_om_test_types: {
			fragment: 'nested',
			where: {type: {_eq: 't2chNestedArgs'}},
		},
	});
	t.is(err, null);
	t.is(response[0].objects.length, 2);

	var [err, response] = await orm.query({
		_om_test_types: {
			fragment: 'nested',
			where: {type: {_eq: 't2chNestedArgs'}},
			variables: {
				objects_limit: 1,
			},
		},
	});
	t.is(err, null);
	t.is(response[0].objects.length, 1);

	var [err, response] = await orm.query({
		_om_test_types: {
			fragment: 'nested',
			where: {type: {_eq: 't2chNestedArgs'}},
			variables: {
				objects_where: {increment: {_eq: 1}},
			},
		},
	});
	t.is(err, null);
	t.is(response[0].objects.length, 1);
	t.is(response[0].objects[0].text, 'test');
});
