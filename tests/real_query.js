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

test('test tables existing', (t) => {
	let orm = t.context.orm;

	t.is(typeof orm.tables._om_test, 'object');
	t.is(typeof orm.tables._om_test_types, 'object');
});
