const {fieldsToGql} = require('../utils/builders');

class Fragment {
	constructor(parameters) {
		const defaultParameters = {
			name: 'base',
			table: null,
			fields: {},
		};

		this.params = Object.assign({}, defaultParameters, parameters);

		if (!this.params.table) {
			throw new Error('table is required');
		}

		if (Object.keys(this.params.fields).length === 0) {
			throw new Error('fields are required');
		}

		this._gqlFields = fieldsToGql(this.params.fields);
	}

	gqlFields() {
		return this._gqlFields;
	}

	build() {
		const fragmentName = `${this.params.name}_fragment_${this.params.table}`;
		const fields = this.gqlFields();

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
