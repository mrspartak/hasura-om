/* 
fields can be

    string: `
        id
        name
    `

    array: [
        'id',
        [
            'logo',
            [
                'id'
            ]
        ]
        or
        {
            key: 'logo',
            values: [
                'id',
            ]
        }
    ]

    object: {
        'id': {},
        'logo': {
            children: ['id']
            children: ` id `
            children: {
                'id': {}
            }
        }
    }
*/
exports.fieldsToGql = function (input) {
	let baseArray = [];
	if (typeof input == 'string') return input;
	else if (Array.isArray(input)) {
		input.forEach((el) => {
			if (typeof el == 'string') baseArray.push(el);
			else if (Array.isArray(el)) {
				if (typeof el[0] != 'string' || !Array.isArray(el[1])) throw new Error('array should contain exactly 2 values, key and children array');

				let subFragment = exports.fieldsToGql(el[1]);
				baseArray.push(`
                    ${el[0]} {
                        ${subFragment}
                    }
                `);
			} else if (typeof el == 'object') {
				if (typeof el.key == 'undefined' || typeof el.values == 'undefined') throw new Error('in array object must have keys: `key` & `values`');

				let subFragment = exports.fieldsToGql(el.values);
				baseArray.push(`
                    ${el.key} {
                        ${subFragment}
                    }
                `);
			} else throw new Error(`unsupported type ${typeof el}`);
		});
		return baseArray.join('\n');
	} else if (typeof input == 'object') {
		Object.keys(input).forEach((key) => {
			let value = input[key];
			if (value.children) {
				let subFragment = exports.fieldsToGql(value.children);
				if (!subFragment) throw new Error(`cant create fields from object ${key}`);

				baseArray.push(`
                    ${key} {
                        ${subFragment}
                    }
                `);
			} else baseArray.push(key);
		});
		return baseArray.join('\n');
	} else throw new Error(`unsupported type ${typeof input}`);
};
