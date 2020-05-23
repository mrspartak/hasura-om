require('dotenv').config();
const test = require('ava');
const {Table, Fragment} = require('../src');
import gql from 'graphql-tag';
gql.disableFragmentWarnings();

test('throws without params', (t) => {
	t.throws(
		() => {
			const orm = new Table();
		},
		{instanceOf: Error},
	);
});

test('succesful contructor', (t) => {
	const table = new Table({
		name: 'test',
	});

	t.true(table instanceof Table);
});

test('throws adding field', (t) => {
	const table = new Table({
		name: 'test',
	});

	t.throws(
		() => {
			table.setField();
		},
		{instanceOf: Error},
	);
});

test('succesfuly add field', (t) => {
	const table = new Table({
		name: 'test',
	});

	table.setField({
		name: 'test',
		type: 'Integer',
	});

	t.is(table.field('test').type, 'Integer');
});

test('field not found', (t) => {
	const table = new Table({
		name: 'test',
	});

	t.throws(
		() => {
			table.field('test');
		},
		{instanceOf: Error},
	);
});

test('testing primary key', (t) => {
	const table = new Table({
		name: 'test',
	});

	table.setField({
		name: 'test',
	});

	t.throws(
		() => {
			table.setPrimarykey();
		},
		{instanceOf: Error},
	);
	t.throws(
		() => {
			table.setPrimarykey('field_not_exist');
		},
		{instanceOf: Error},
	);
	t.throws(
		() => {
			table.setPrimarykey({some_other_key: 'test'});
		},
		{instanceOf: Error},
	);

	table.setPrimarykey('test');
	t.is(table.field('test').isPrimary, true);
});

test('throws creating fragment', (t) => {
	const table = new Table({
		name: 'test',
	});

	t.throws(
		() => {
			table.createFragment();
		},
		{instanceOf: Error},
	);
});

test('fragment not found', (t) => {
	const table = new Table({
		name: 'test',
	});

	t.is(table.fragment('test'), false);
});

test('fragment found', (t) => {
	const table = new Table({
		name: 'test',
	});
	table.setField({
		name: 'id',
		type: 'Integer',
	});
	table.init();

	t.true(table.fragment('base') instanceof Fragment);
	t.is(table.fragment('pk'), false);

	table.field('id').isPrimary = true;
	table.init();

	t.true(table.fragment('pk') instanceof Fragment);

	const testFragment = gql`
		fragment base_fragment_test on test {
			id
		}
	`;
	const {raw} = table.fragment('base').build();
	t.deepEqual(gql(raw), testFragment);
});

test('build fields for query', (t) => {
	const table = new Table({
		name: 'test',
	});
	table.setField({
		name: 'id',
		type: 'Integer',
	});

	// No fragments
	t.throws(
		() => {
			table.getFieldsFromParams({});
		},
		{instanceOf: Error},
	);

	table.init();

	/*
		When no input specified, we use base fragment
	*/
	var testFragment = gql`
		fragment base_fragment_test on test {
			id
		}
	`;
	var {fields, fragment, fragmentName} = table.getFieldsFromParams({});
	t.is(fragmentName, 'base_fragment_test');
	t.deepEqual(gql(fragment), testFragment);
	t.is(fields, '...base_fragment_test');

	var {fields, fragment, fragmentName} = table.getFieldsFromParams({
		fragment: 'base',
	});
	t.is(fragmentName, 'base_fragment_test');
	t.deepEqual(gql(fragment), testFragment);
	t.is(fields, '...base_fragment_test');

	/*
		Will throw an error when can't find a fragment in table
	*/
	t.throws(
		() => {
			table.getFieldsFromParams({
				fragment: 'fragment_do_not_exist',
			});
		},
		{instanceOf: Error},
	);

	/*
		When no input specified, we use base fragment
	*/
	var {fields, fragment, fragmentName} = table.getFieldsFromParams({
		fields: `
			id
			logo
		`,
	});
	t.is(fragmentName, '');
	t.is(fragment, '');
	t.true(fields.includes('id'));
	t.true(fields.includes('logo'));

	/*
		We passing custom fragment
	*/
	var testFragment = gql`
		fragment main_fragment_test on test {
			id
			test
		}
	`;
	var {fields, fragment, fragmentName} = table.getFieldsFromParams({
		fragment: new Fragment({
			name: 'main',
			table: 'test',
			fields: `
				id
				test
			`,
		}),
	});
	t.is(fragmentName, 'main_fragment_test');
	t.deepEqual(gql(fragment), testFragment);
	t.is(fields, '...main_fragment_test');
});
