require('dotenv').config();
const test = require('ava');
const { Hasura } = require('../src/');

test('throws without params', (t) => {
	t.throws(
		() => {
			const orm = new Hasura();
		},
		{ instanceOf: Error },
	);
});

test('still throws without params', (t) => {
	t.throws(
		() => {
			const orm = new Hasura({
				graphqlUrl: 'ufhreioor',
			});
		},
		{ instanceOf: Error },
	);
});

test('graphqlUrl is not an url', (t) => {
	t.throws(
		() => {
			const orm = new Hasura({
				graphqlUrl: 123,
			});
		},
		{ instanceOf: Error },
	);
});
