require('dotenv').config();
const test = require('ava');
const { Table, Fragment } = require('../src/');
import gql from 'graphql-tag';
gql.disableFragmentWarnings();

test('throws without params', (t) => {
	t.throws(
		() => {
			const orm = new Table();
		},
		{ instanceOf: Error },
	);
});

test('succesful contructor', (t) => {
	let table = new Table({
		name: 'test',
	});

	t.true(table instanceof Table);
});

test('throws adding field', (t) => {
	let table = new Table({
		name: 'test',
	});

	t.throws(
		() => {
			table.setField();
		},
		{ instanceOf: Error },
	);
});

test('succesfuly add field', (t) => {
	let table = new Table({
		name: 'test',
	});

	table.setField({
		name: 'test',
		type: 'Integer',
	});

	t.is(table.field('test').type, 'Integer');
});

test('field not found', (t) => {
	let table = new Table({
		name: 'test',
	});

	t.throws(
		() => {
			table.field('test');
		},
		{ instanceOf: Error },
	);
});

test('testing primary key', (t) => {
	let table = new Table({
		name: 'test',
	});

	table.setField({
		name: 'test',
	});

	t.throws(
		() => {
			table.setPrimarykey();
		},
		{ instanceOf: Error },
	);
	t.throws(
		() => {
			table.setPrimarykey('field_not_exist');
		},
		{ instanceOf: Error },
	);
	t.throws(
		() => {
			table.setPrimarykey({ some_other_key: 'test' });
		},
		{ instanceOf: Error },
	);

	table.setPrimarykey('test');
	t.is(table.field('test').isPrimary, true);
});

test('throws creating fragment', (t) => {
	let table = new Table({
		name: 'test',
	});

	t.throws(
		() => {
			table.createFragment();
		},
		{ instanceOf: Error },
	);
});

test('fragment not found', (t) => {
	let table = new Table({
		name: 'test',
	});

	t.throws(
		() => {
			table.fragment('test');
		},
		{ instanceOf: Error },
	);
});

test('fragment found', (t) => {
	let table = new Table({
		name: 'test',
	});
	table.setField({
		name: 'id',
		type: 'Integer',
	});
	table.createFragment('base');

	t.true(table.fragment('base') instanceof Fragment);

	const testFragment = gql`
		fragment base_fragment_test on test {
			id
		}
	`;
	var { raw } = table.fragment('base').build();
	t.deepEqual(gql(raw), testFragment);
});

test('build fields for query', (t) => {
	let table = new Table({
		name: 'test',
	});
	table.setField({
		name: 'id',
		type: 'Integer',
	});

	//no fragments
	t.throws(
		() => {
			table.getFieldsFromParams({});
		},
		{ instanceOf: Error },
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
	var { fields, fragment, fragmentName } = table.getFieldsFromParams({});
	t.is(fragmentName, 'base_fragment_test');
	t.deepEqual(gql(fragment), testFragment);
	t.is(fields, '...base_fragment_test');

	var { fields, fragment, fragmentName } = table.getFieldsFromParams({
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
		{ instanceOf: Error },
	);

	/* 
		When no input specified, we use base fragment
	*/
	var { fields, fragment, fragmentName } = table.getFieldsFromParams({
		fields: `
			id
			logo
		`,
	});
	t.is(fragmentName, '');
	t.is(fragment, '');
	t.true(fields.indexOf('id') != -1);
	t.true(fields.indexOf('logo') != -1);

	/* 
		We passing custom fragment
	*/
	var testFragment = gql`
		fragment main_fragment_test on test {
			id
			test
		}
	`;
	var { fields, fragment, fragmentName } = table.getFieldsFromParams({
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
