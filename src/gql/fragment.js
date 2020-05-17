const { fieldsToGql } = require('./fields');

class Fragment {
	constructor(params) {
		const defaultParams = {
			name: 'base',
			table: null,
			fields: {},
		};

		this.params = Object.assign({}, defaultParams, params);

		if (!this.params.table) throw new Error('table is required');

		this.gqlFields = fieldsToGql(this.params.fields);
	}

	toString() {
		let fragmentName = `${this.params.name}_fragment_${this.params.table}`;
		let fields = this.gqlFields;

		return {
			name: fragmentName,
			raw: `
                fragment ${fragmentName} on ${this.params.table} {
                    ${fields}
                }
            `,
		};
	}
}

module.exports = Fragment;
