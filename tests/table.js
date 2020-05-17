require('dotenv').config();
const test = require('ava');
const { Table } = require('../src/');

test('throws without params', (t) => {
	t.throws(
		() => {
			const orm = new Table();
		},
		{ instanceOf: Error },
	);
});

test('still throws without params', (t) => {
	t.throws(
		() => {
			const orm = new Table({
				name: 'ufhreioor',
			});
		},
		{ instanceOf: Error },
	);
});

test('succesful contructor', (t) => {
	let table = new Table({
		name: 'test',
		type: 'BASE TABLE',
	});

	t.true(table instanceof Table);
});

test('throws adding field', (t) => {
	let table = new Table({
		name: 'test',
		type: 'BASE TABLE',
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
		type: 'BASE TABLE',
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
		type: 'BASE TABLE',
	});

	t.throws(
		() => {
			table.field('test');
		},
		{ instanceOf: Error },
	);
});
