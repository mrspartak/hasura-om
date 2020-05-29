require('dotenv').config();
const test = require('ava');
const {Hasura} = require('../src');
const __ = require('../src/utils/helpers');

test.before((t) => {
	const orm = new Hasura({
		graphqlUrl: process.env.GQL_ENDPOINT,
		jwt: process.env.JWT_TOKEN,
	});

	orm.createTable({name: '_om_test'})
		.createField({name: 'id', isPrimary: true})
		.createField({name: 'text'})
		.createField({name: 'increment'})
		.createField({name: 'type'})
		.generateBaseFragments();
	orm.createTable({name: '_om_test_types'}).createField({name: 'type', isPrimary: true}).createField({name: 'description'}).generateBaseFragments();

	t.context.orm = orm;
});

test.serial('no access to table', async (t) => {
	const orm = t.context.orm;

	var [err] = await orm.query({
		_om_test_types: {},
	});
	t.true(err instanceof Error);

	var [err] = await orm.query({
		_om_test: {},
	});
	t.true(err instanceof Error);

	var [err] = await orm.mutate({
		_om_test: {
			delete: {where: {}},
		},
	});
	t.true(err instanceof Error);
});

test.serial('right access to a table', async (t) => {
	const orm = t.context.orm;

	orm.createTable({name: '_om_test'}).createField({name: 'id', isPrimary: true}).createField({name: 'text'}).createField({name: 'increment'}).generateBaseFragments();

	var [err] = await orm.query({
		_om_test: {},
	});
	t.is(err, null);
});
