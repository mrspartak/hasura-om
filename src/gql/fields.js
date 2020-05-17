/* 
fields can be

    string: `
        id
        name
    `

    array: [
        'id',
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
			if (Array.isArray(el)) throw new Error('array cant contain array');
			else if (typeof el == 'object') {
				let subFragment = exports.fieldsToGql(el.values);
				baseArray.push(`
                    ${el.key} {
                        ${subFragment}
                    }
                `);
			} else baseArray.push(el);
		});
		return baseArray.join('\n');
	} else if (typeof input == 'object') {
		Object.keys(input).forEach((key) => {
			let value = input[key];
			if (value.children) {
				let subFragment = exports.fieldsToGql(value.children);
				baseArray.push(`
                    ${key} {
                        ${subFragment}
                    }
                `);
			} else baseArray.push(key);
		});
		return baseArray.join('\n');
	}
};
