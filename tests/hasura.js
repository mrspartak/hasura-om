require('dotenv').config();
const test = require('ava');
const {Hasura, Table} = require('../src');

test('throws without params', (t) => {
	t.throws(
		() => {
			const orm = new Hasura();
		},
		{instanceOf: Error},
	);

	t.throws(
		() => {
			const orm = new Hasura({
				graphqlUrl: 123,
			});
		},
		{instanceOf: Error},
	);
});

test('succesful contructor', (t) => {
	const orm = new Hasura({
		graphqlUrl: 'efwehfwiefjwopeif',
		adminSecret: 'qwdqwdqwdqwd',
	});

	t.true(orm instanceof Hasura);
});

test('getting table', (t) => {
	const orm = new Hasura({
		graphqlUrl: 'efwehfwiefjwopeif',
		adminSecret: 'qwdqwdqwdqwd',
	});

	t.throws(
		() => {
			orm.table('do_not_exist');
		},
		{instanceOf: Error},
	);

	t.throws(
		() => {
			orm.createTable();
		},
		{instanceOf: Error},
	);

	orm.createTable({
		name: 'test',
		type: 'BASE TABLE',
	});
	t.true(orm.table('test') instanceof Table);
});

test('create table full chain', (t) => {
	const orm = new Hasura({
		graphqlUrl: 'efwehfwiefjwopeif',
		adminSecret: 'qwdqwdqwdqwd',
	});

	orm.createTable({name: 'user'}).createField({name: 'id', isPrimary: true}).createField({name: 'name'}).generateBaseFragments();

	t.is(orm.table('user').field('id').isPrimary, true);
	t.is(orm.table('user').field('name').isPrimary, false);
	t.is(orm.table('user').fragment('base').name(), 'base_fragment_user');
	t.is(orm.table('user').fragment('pk').fields(), 'id');
});
