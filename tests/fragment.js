const test = require('ava');
const {Fragment} = require('../src');
import gql from 'graphql-tag';
gql.disableFragmentWarnings();

test('wrong fragment define', (t) => {
	t.throws(
		() => {
			return new Fragment();
		},
		{instanceOf: Error},
	);

	t.throws(
		() => {
			return new Fragment({
				name: '123',
			});
		},
		{instanceOf: Error},
	);

	t.throws(
		() => {
			return new Fragment({
				name: '123',
				table: 'test',
			});
		},
		{instanceOf: Error},
	);
});

test('succesful contructor', (t) => {
	const fragment = new Fragment({
		table: 'test',
		fields: ['id'],
	});

	t.true(fragment instanceof Fragment);
});

test('getting fragment name', (t) => {
	const fragment = new Fragment({
		table: 'test',
		fields: ['id'],
	});
	t.is(fragment.name(), 'base_fragment_test');

	const fragment2 = new Fragment({
		table: 'test2',
		name: 'new',
		fields: ['id'],
	});
	t.is(fragment2.name(), 'new_fragment_test2');
});

test('getting fragment arguments', (t) => {
	const fragment = new Fragment({
		table: 'test',
		fields: ['id'],
	});
	t.deepEqual(fragment.arguments(), []);

	const fragment2 = new Fragment({
		table: 'test',
		fields: [
			'id',
			[
				'logo',
				['url'],
				{
					_table: 'images',
					limit: 'logo_limit',
					offset: 'logo_offset',
					where: 'logo_where',
					order_by: 'logo_order_by',
					distinct_on: 'logo_distinct_on',
				},
			],
		],
	});
	t.deepEqual(fragment2.arguments(), [
		'$logo_limit: Int',
		'$logo_offset: Int',
		'$logo_where: images_bool_exp',
		'$logo_order_by: [images_order_by!]',
		'$logo_distinct_on: [images_select_column!]',
	]);
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

	// Declaring fields with array
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
	t.deepEqual(gql(fragment.fragment()), testFragment);

	// Declaring fields with array 2nd way
	var fragment = new Fragment({
		table: 'test',
		fields: ['id', 'name', ['logo', ['url']]],
	});
	t.deepEqual(gql(fragment.fragment()), testFragment);

	// Declaring fileds with string
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
	t.deepEqual(gql(fragment.fragment()), testFragment);

	// Declaring fileds with object
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
	t.deepEqual(gql(fragment.fragment()), testFragment);
});

test('nested arguments declaration', (t) => {
	const testFragment = gql`
		fragment base_fragment_test on test {
			id
			name
			logo(where: $logo_where) {
				url
			}
		}
	`;

	var fragment = new Fragment({
		table: 'test',
		name: 'base',
		fields: {
			id: {},
			name: {},
			logo: {
				children: {
					url: {},
				},
				arguments: {
					_table: 'logo',
					where: 'logo_where',
					unexpected_argument: 'test',
				},
			},
		},
	});
	t.deepEqual(gql(fragment.fragment()), testFragment);
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

	// Declaring fileds with array
	const fragment = new Fragment({
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
	const {raw} = fragment.build();
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
		{instanceOf: Error},
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
		{instanceOf: Error},
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
		{instanceOf: Error},
	);

	t.throws(
		() => {
			return new Fragment({
				table: 'test',
				fields: 123,
			});
		},
		{instanceOf: Error},
	);

	t.throws(
		() => {
			return new Fragment({
				table: 'test',
				fields: [123],
			});
		},
		{instanceOf: Error},
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

	const baseTestFragment = new Fragment({
		name: 'base',
		table: 'test',
		fields: ['id', 'name'],
	});
	const baseLogoFragment = new Fragment({
		name: 'base',
		table: 'logo',
		fields: ['host', 'path'],
	});

	var mainFragment = new Fragment({
		name: 'main',
		table: 'test',
		fields: [
			baseTestFragment,
			{
				key: 'logo',
				values: baseLogoFragment,
			},
		],
	});
	var {raw} = mainFragment.build();
	t.deepEqual(gql(raw), testFragment);

	var mainFragment = new Fragment({
		name: 'main',
		table: 'test',
		fields: `
			${baseTestFragment.fields()}
			logo {
				${baseLogoFragment.fields()}
			}
		`,
	});
	var {raw} = mainFragment.build();
	t.deepEqual(gql(raw), testFragment);
});

test('check fields function', (t) => {
	const baseTestFragment = new Fragment({
		name: 'base',
		table: 'test',
		fields: ['id', 'name'],
	});

	t.is(typeof baseTestFragment.fields(), 'string');
});
