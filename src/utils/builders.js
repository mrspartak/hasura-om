/*
Fields can be
    string: `
        id
        logo (limit: $custom_limit) {
            id
        }
    `

    array: [
        'id',
        [
            'logo',
            [
                'id'
            ],
            {
                limit: 'custom_limit'
            }
        ]
        or
        {
            key: 'logo',
            values: [
                'id',
            ],
            filter: {
                limit: 'custom_limit'
            }
        }
    ]

    object: {
        'id': {},
        'logo': {
            children: ['id']
            or
            children: ` id `
            or
            children: {
                'id': {}
            }

            filter: {
                limit: 'custom_limit'
            }
        }
    }
*/
exports.fieldsToGql = function (input) {
	const fragmentFields = [];
	const fragmentOperationArgument = [];
	// Const fragmentVariables = {};
	if (typeof input === 'string') {
		fragmentFields.push(input);
	} else if (Array.isArray(input)) {
		input.forEach((element) => {
			if (typeof element === 'string') {
				fragmentFields.push(element);
			} else if (typeof element === 'object' && element._isFragment === true) {
				const fields = element.fields();
				fragmentFields.push(fields);
			} else if (Array.isArray(element)) {
				if (typeof element[0] !== 'string' || !Array.isArray(element[1]) || element.length > 3) {
					throw new Error('[builders/fieldsToGql] array should contain exactly {2, 3} values, key and children array');
				}

				const subFragment = exports.fieldsToGql(element[1]);

				const {argumentQuery, subQueryOperationArguments} = exports.queryFilters(element[2] || []);
				fragmentOperationArgument.push(...subQueryOperationArguments);
				fragmentOperationArgument.push(...subFragment.fragmentOperationArgument);

				fragmentFields.push(`
                    ${element[0]} ${argumentQuery} {
                        ${subFragment.fields}
                    }
                `);
			} else if (typeof element === 'object') {
				if (typeof element.key === 'undefined' || typeof element.values === 'undefined') {
					throw new TypeError('[builders/fieldsToGql] in array object must have keys: `key` & `values`');
				}

				const subFragment = exports.fieldsToGql(element.values);
				fragmentOperationArgument.push(...subFragment.fragmentOperationArgument);

				fragmentFields.push(`
                    ${element.key} {
                        ${subFragment.fields}
                    }
                `);
			} else {
				throw new TypeError(`[builders/fieldsToGql] unsupported type ${typeof element}`);
			}
		});
	} else if (typeof input === 'object' && input._isFragment === true) {
		const fields = input.fields();
		fragmentFields.push(fields);
	} else if (typeof input === 'object') {
		Object.keys(input).forEach((key) => {
			const value = input[key];
			if (value.children) {
				const {argumentQuery, subQueryOperationArguments} = exports.queryFilters(value.arguments || []);
				fragmentOperationArgument.push(...subQueryOperationArguments);

				const subFragment = exports.fieldsToGql(value.children);
				fragmentOperationArgument.push(...subFragment.fragmentOperationArgument);

				if (!subFragment.fields) {
					throw new Error(`[builders/fieldsToGql] cant create fields from object ${key}`);
				}

				fragmentFields.push(`
                    ${key}${argumentQuery} {
                        ${subFragment.fields}
                    }
                `);
			} else {
				fragmentFields.push(key);
			}
		});
	}

	if (fragmentFields.length === 0) throw new Error(`[builders/fieldsToGql] unsupported type ${typeof input}`);

	return {
		fields: fragmentFields.join('\n'),
		fragmentOperationArgument,
	};
};

/* 
    Object { 
		_table: 'test',
		limit: 'limit' 
	}

    return '' | (limit: $limit)
*/
exports.queryFilters = function (input) {
	const args = [];
	const subQueryOperationArguments = [];
	const table = input._table;

	if (!Array.isArray(input) && typeof input === 'object') {
		if (!table) throw new Error('[builders/queryFilters] input._table is required');
		const argumentDict = {
			where: `${table}_bool_exp`,
			limit: `Int`,
			offset: `Int`,
			order_by: `[${table}_order_by!]`,
			distinct_on: `[${table}_select_column!]`,
			objects: `[${table}_insert_input!]!`,
			on_conflict: `${table}_on_conflict`,
			_set: `${table}_set_input`,
			_inc: `${table}_inc_input`,
		};

		Object.keys(input).forEach((key) => {
			if (key === '_table') return;
			if (!argumentDict[key]) return;

			const value = input[key];
			if (typeof value !== 'string') throw new Error('[builders/queryFilters] value of object should be a string');

			subQueryOperationArguments.push(`$${value}: ${argumentDict[key]}`);
			args.push(`${key}: $${value}`);
		});
	}

	const argumentQuery = args.length === 0 ? '' : `(${args.join(',')})`;
	return {argumentQuery, subQueryOperationArguments};
};

/* 
    Tag template function
    let queryTemplate = template`
        query ${'arguments'} {
            ${'fields'}
        }
    `

    queryTemplate({
        arguments: '(where: $where)',
        fields: 'id'
    }) =>

    query (where: $where) {
        id
    }

*/
exports.template = function (strings, ...keys) {
	return function (...values) {
		const dict = values[values.length - 1] || {};
		const result = [strings[0]];
		keys.forEach(function (key, i) {
			let value = '';
			if (Number.isInteger(key) && typeof values[key] !== 'undefined') value = values[key];
			else if (typeof dict[key] !== 'undefined') value = dict[key];
			else value = key;
			result.push(value, strings[i + 1]);
		});
		return result.join('');
	};
};
