const test = require('ava');
const { Fragment } = require('../src/');
import gql from 'graphql-tag';
gql.disableFragmentWarnings();

test('wrong fragment define', (t) => {
	t.throws(
		() => {
			return new Fragment();
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			return new Fragment({
				name: '123',
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			return new Fragment({
				name: '123',
				table: 'test',
			});
		},
		{ instanceOf: Error },
	);
});

test('succesful contructor', (t) => {
	let fragment = new Fragment({
		table: 'test',
		fields: ['id'],
	});

	t.true(fragment instanceof Fragment);
});

test('getting fragment name', (t) => {
	let fragment = new Fragment({
		table: 'test',
		fields: ['id'],
	});

	//right naming using table and fragment names
	var { name } = fragment.build();
	t.is(name, 'base_fragment_test');

	fragment.params.table = 'test2';
	fragment.params.name = 'new';
	var { name } = fragment.build();
	t.is(name, 'new_fragment_test2');
});

test('checking fragment decalration', (t) => {
	const testFragment = gql`
		fragment base_fragment_test on test {
			id
			name
			logo {
				url
			}
		}
	`;

	//declaring fileds with array
	var fragment = new Fragment({
		table: 'test',
		fields: [
			'id',
			'name',
			{
				key: 'logo',
				values: ['url'],
			},
		],
	});
	var { raw } = fragment.build();
	t.deepEqual(gql(raw), testFragment);

	//declaring fileds with string
	var fragment = new Fragment({
		table: 'test',
		fields: `
            id
            name
            logo {
                url
            }
        `,
	});
	var { raw } = fragment.build();
	t.deepEqual(gql(raw), testFragment);

	//declaring fileds with object
	var fragment = new Fragment({
		table: 'test',
		fields: {
			id: {},
			name: {},
			logo: {
				children: ['url'],
			},
		},
	});
	var { raw } = fragment.build();
	t.deepEqual(gql(raw), testFragment);
});

test('checking big declaration', (t) => {
	const testFragment = gql`
		fragment base_fragment_test on test {
			id
			name
			logo {
				host
				path
			}
			teams {
				id
				title
				members {
					id
					name
					logo {
						host
						path
					}
				}
			}
		}
	`;

	//declaring fileds with array
	var fragment = new Fragment({
		table: 'test',
		fields: [
			'id',
			'name',
			{
				key: 'logo',
				values: ['host', 'path'],
			},
			{
				key: 'teams',
				values: [
					'id',
					'title',
					{
						key: 'members',
						values: [
							'id',
							'name',
							{
								key: 'logo',
								values: ['host', 'path'],
							},
						],
					},
				],
			},
		],
	});
	var { raw } = fragment.build();
	t.deepEqual(gql(raw), testFragment);
});

test('check for incopatable fields format', (t) => {
	t.throws(
		() => {
			return new Fragment({
				table: 'test',
				fields: [['id']],
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			return new Fragment({
				table: 'test',
				fields: [
					'id',
					{
						some: 'name',
					},
				],
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			return new Fragment({
				table: 'test',
				fields: {
					id: {},
					langs: {
						children: [],
					},
				},
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			return new Fragment({
				table: 'test',
				fields: 123,
			});
		},
		{ instanceOf: Error },
	);

	t.throws(
		() => {
			return new Fragment({
				table: 'test',
				fields: [123],
			});
		},
		{ instanceOf: Error },
	);
});

test('check extension', (t) => {
	const testFragment = gql`
		fragment main_fragment_test on test {
			id
			name
			logo {
				host
				path
			}
		}
	`;

	let baseTestFragment = new Fragment({
		name: 'base',
		table: 'test',
		fields: ['id', 'name'],
	});
	let baseLogoFragment = new Fragment({
		name: 'base',
		table: 'logo',
		fields: ['host', 'path'],
	});

	var mainFragment = new Fragment({
		name: 'main',
		table: 'test',
		fields: [
			baseTestFragment.gqlFields(),
			{
				key: 'logo',
				values: baseLogoFragment.gqlFields(),
			},
		],
	});
	var { raw } = mainFragment.build();
	t.deepEqual(gql(raw), testFragment);

	var mainFragment = new Fragment({
		name: 'main',
		table: 'test',
		fields: `
			${baseTestFragment.gqlFields()}
			logo {
				${baseLogoFragment.gqlFields()}
			}
		`,
	});
	var { raw } = mainFragment.build();
	t.deepEqual(gql(raw), testFragment);
});

test('check gqlFields function', (t) => {
	let baseTestFragment = new Fragment({
		name: 'base',
		table: 'test',
		fields: ['id', 'name'],
	});

	t.is(typeof baseTestFragment.gqlFields(), 'string');
});
