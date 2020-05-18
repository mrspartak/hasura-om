require('dotenv').config();
const test = require('ava');
const { Hasura, Table } = require('../src/');

test('throws without params', (t) => {
	t.throws(
		() => {
			const orm = new Hasura();
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			const orm = new Hasura({
				graphqlUrl: 'ufhreioor',
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			const orm = new Hasura({
				graphqlUrl: 123,
			});
		},
		{ instanceOf: Error },
	);
});

test('succesful contructor', (t) => {
	let orm = new Hasura({
		graphqlUrl: 'efwehfwiefjwopeif',
		adminSecret: 'qwdqwdqwdqwd',
	});

	t.true(orm instanceof Hasura);
});

test('getting table', (t) => {
	let orm = new Hasura({
		graphqlUrl: 'efwehfwiefjwopeif',
		adminSecret: 'qwdqwdqwdqwd',
	});

	t.throws(
		() => {
			orm.table('do_not_exist');
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			orm.createTable();
		},
		{ instanceOf: Error },
	);

	orm.createTable({
		name: 'test',
		type: 'BASE TABLE',
	});
	t.true(orm.table('test') instanceof Table);
});
