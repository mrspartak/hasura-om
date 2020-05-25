const {fieldsToGql, template} = require('../utils/builders');

class Fragment {
	constructor(parameters) {
		this._isFragment = true;

		const defaultParameters = {
			name: 'base',
			table: null,
			fields: {},
		};

		this.params = Object.assign({}, defaultParameters, parameters);

		if (!this.params.table) {
			throw new Error('table is required');
		}

		if (Object.keys(this.rawFields()).length === 0 || this.rawFields() === '') {
			throw new Error('fields are required');
		}

		// Builded fields part of fragment
		const {fields, fragmentOperationArgument} = fieldsToGql(this.rawFields());
		this._fields = fields;
		this._arguments = fragmentOperationArgument;

		// Templates to create parts local parts of fragment
		this._fragmentTemplate = template`
			fragment ${'fragmentName'} on ${'table'} {
				${'fields'}
			}
		`;
		this._nameTemplate = template`${'name'}_fragment_${'table'}`;
	}

	/* 
		Fields passed to Fragment constructor
	*/
	rawFields() {
		return this.params.fields;
	}

	/* 
		Generated fields to string
	*/
	fields() {
		return this._fields;
	}

	/* 
	 	Generated arguments if fragment contains them
	*/
	arguments() {
		return this._arguments;
	}

	/* 
		Generated Fragment name
	*/
	name() {
		return this._nameTemplate({
			name: this.params.name,
			table: this.params.table,
		});
	}

	/* 
		Generated Fragment
	*/
	fragment() {
		return this._fragmentTemplate({
			fragmentName: this.name(),
			table: this.params.table,
			fields: this.fields(),
		});
	}

	build() {
		return {
			name: this.name(),
			raw: this.fragment(),
			arguments: this.arguments(),
		};
	}
}

module.exports = Fragment;
