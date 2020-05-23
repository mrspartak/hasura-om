/*
Fields can be

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
    const baseArray = [];
    if (typeof input === 'string') {
        return input;
    }

    if (Array.isArray(input)) {
        input.forEach((element) => {
            if (typeof element === 'string') {
                baseArray.push(element);
            } else if (Array.isArray(element)) {
                if (typeof element[0] !== 'string' || !Array.isArray(element[1])) {
                    throw new TypeError('array should contain exactly 2 values, key and children array');
                }

                const subFragment = exports.fieldsToGql(element[1]);
                baseArray.push(`
                    ${element[0]} {
                        ${subFragment}
                    }
                `);
            } else if (typeof element === 'object') {
                if (typeof element.key === 'undefined' || typeof element.values === 'undefined') {
                    throw new TypeError('in array object must have keys: `key` & `values`');
                }

                const subFragment = exports.fieldsToGql(element.values);
                baseArray.push(`
                    ${element.key} {
                        ${subFragment}
                    }
                `);
            } else {
                throw new TypeError(`unsupported type ${typeof element}`);
            }
        });
        return baseArray.join('\n');
    }

    if (typeof input === 'object') {
        Object.keys(input).forEach((key) => {
            const value = input[key];
            if (value.children) {
                const subFragment = exports.fieldsToGql(value.children);
                if (!subFragment) {
                    throw new Error(`cant create fields from object ${key}`);
                }

                baseArray.push(`
                    ${key} {
                        ${subFragment}
                    }
                `);
            } else {
                baseArray.push(key);
            }
        });
        return baseArray.join('\n');
    }

    throw new Error(`unsupported type ${typeof input}`);
};
