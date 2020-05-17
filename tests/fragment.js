const test = require('ava');
const Fragment = require('../src/gql/fragment');
import gql from 'graphql-tag';
gql.disableFragmentWarnings();

test('define new fragment', (t) => {
	let fragment = new Fragment({
		table: 'test',
	});
	t.pass();
});

test('define empty fragment', (t) => {
	try {
		let fragment = new Fragment();
		t.fail(new Error('should fail without required fields'));
	} catch (err) {
		t.pass();
	}
});

test('getting fragment name', (t) => {
	let fragment = new Fragment({
		table: 'test',
	});

	//right naming using table and fragment names
	var { name } = fragment.toString();
	t.is(name, 'base_fragment_test');

	fragment.params.table = 'test2';
	fragment.params.name = 'new';
	var { name } = fragment.toString();
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
	var { raw } = fragment.toString();
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
	var { raw } = fragment.toString();
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
	var { raw } = fragment.toString();
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
	var { raw } = fragment.toString();
	t.deepEqual(gql(raw), testFragment);
});
