const Fragment = require('./gql/fragment');
const { fieldsToGql } = require('./gql/fields');

class Table {
	constructor(params) {
		const defaultParams = {
			name: null,
			type: null,
		};

		this.params = Object.assign({}, defaultParams, params);

		if (!this.params.name) throw new Error('name is required');
		if (!this.params.type) throw new Error('type is required');

		this.fields = {};
		this.pkeys = {};
		this.fragments = {};
	}

	setField(params) {
		if (!params.name) throw new Error('name is required');
		if (!params.type) throw new Error('type is required');

		this.fields[params.name] = params;
	}

	setPrimarykey(params) {
		if (!params.name) throw new Error('name is required');

		this.pkeys[params.name] = params;
	}

	init() {
		this.createFragment();
	}

	createFragment(name = 'base', fields = false) {
		this.fragments[name] = new Fragment({
			table: this.params.name,
			name,
			fields: fields ? fields : this.fields,
		});
	}

	/* 
        query_fields:
            distinct_on: [chat_list_select_column!]
            limit: Int
            offset: Int
            order_by: [chat_list_order_by!]
            where: chat_list_bool_exp

        table
            name

        return
            fragment
            fields
    */
	buildQuery(params) {
		var { fields, fragment, fragmentName } = this.getFieldsFromParams(params);

		let variables = {},
			query_variables = [],
			query_field_variables = [];

		let predifinedVariables = {
			where: {
				type(name) {
					return `${name}_bool_exp`;
				},
			},
			limit: {
				type(name) {
					return `Int`;
				},
			},
			offset: {
				type(name) {
					return `Int`;
				},
			},
			order_by: {
				type(name) {
					return `[${name}_order_by!]`;
				},
			},
			distinct_on: {
				type(name) {
					return `[${name}_select_column!]`;
				},
			},
		};

		Object.keys(predifinedVariables).forEach((varName) => {
			let varOpts = predifinedVariables[varName];

			let varKey = `${this.params.name}_${varName}`;

			if (params[varName]) {
				variables[varKey] = params[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOpts.type(this.params.name)}`);
			}
		});

		return {
			query: {
				name: `Q${this.params.name}`,
				variables: query_variables,
				fields: `
                    ${this.params.name}(${query_field_variables.join(', ')}) {
                        ${fields}
                    }
                `,
				fragment: {
					fragment,
					fragmentName,
				},
			},
			variables,
		};
	}

	buildMutation(params) {
		let mutations = Object.keys(params);

		let toReturn = [];
		mutations.forEach((mutationName) => {
			let builtFuncName = `build_${mutationName}`;
			if (typeof this[builtFuncName] != 'function') return;

			toReturn.push(this[builtFuncName](params[mutationName]));
		});

		return toReturn;
	}

	build_insert(params) {
		var { fields, fragment, fragmentName } = this.getFieldsFromParams(params);

		let variables = {},
			query_variables = [],
			query_field_variables = [];

		let predifinedVariables = {
			objects: {
				type(name) {
					return `[${name}_insert_input!]!`;
				},
			},
			on_conflict: {
				type(name) {
					return `${name}_on_conflict`;
				},
			},
		};

		Object.keys(predifinedVariables).forEach((varName) => {
			let varOpts = predifinedVariables[varName];

			let varKey = `i_${this.params.name}_${varName}`;

			if (params[varName]) {
				variables[varKey] = params[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOpts.type(this.params.name)}`);
			}
		});

		let flatKey = `${this.params.name}.insert`;
		let flatSetting = {};
		flatSetting[flatKey] = `insert_${this.params.name}.returning`;

		return {
			query: {
				name: `I_${this.params.name}`,
				flatSetting,
				variables: query_variables,
				fields: `
                    insert_${this.params.name}(${query_field_variables.join(', ')}) {
                        returning {
                            ${fields}
                        }
                    }
                `,
				fragment: {
					fragment,
					fragmentName,
				},
			},
			variables,
		};
	}

	build_update(params) {
		var { fields, fragment, fragmentName } = this.getFieldsFromParams(params);

		let variables = {},
			query_variables = [],
			query_field_variables = [];

		let predifinedVariables = {
			where: {
				type(name) {
					return `${name}_bool_exp!`;
				},
			},
			_set: {
				type(name) {
					return `${name}_set_input`;
				},
			},
			_inc: {
				type(name) {
					return `${name}_inc_input`;
				},
			},
		};

		Object.keys(predifinedVariables).forEach((varName) => {
			let varOpts = predifinedVariables[varName];

			let varKey = `u_${this.params.name}_${varName}`;

			if (params[varName]) {
				variables[varKey] = params[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOpts.type(this.params.name)}`);
			}
		});

		let flatKey = `${this.params.name}.update`;
		let flatSetting = {};
		flatSetting[flatKey] = `update_${this.params.name}.returning`;

		return {
			query: {
				name: `U_${this.params.name}`,
				flatSetting,
				variables: query_variables,
				fields: `
                    update_${this.params.name}(${query_field_variables.join(', ')}) {
                        returning {
                            ${fields}
                        }
                    }
                `,
				fragment: {
					fragment,
					fragmentName,
				},
			},
			variables,
		};
	}

	build_delete(params) {
		var { fields, fragment, fragmentName } = this.getFieldsFromParams(params);

		let variables = {},
			query_variables = [],
			query_field_variables = [];

		let predifinedVariables = {
			where: {
				type(name) {
					return `${name}_bool_exp!`;
				},
			},
		};

		Object.keys(predifinedVariables).forEach((varName) => {
			let varOpts = predifinedVariables[varName];

			let varKey = `d_${this.params.name}_${varName}`;

			if (params[varName]) {
				variables[varKey] = params[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOpts.type(this.params.name)}`);
			}
		});

		let flatKey = `${this.params.name}.delete`;
		let flatSetting = {};
		flatSetting[flatKey] = `delete_${this.params.name}.returning`;

		return {
			query: {
				name: `D_${this.params.name}`,
				flatSetting,
				variables: query_variables,
				fields: `
                    delete_${this.params.name}(${query_field_variables.join(', ')}) {
                        returning {
                            ${fields}
                        }
                    }
                `,
				fragment: {
					fragment,
					fragmentName,
				},
			},
			variables,
		};
	}

	getFieldsFromParams(params) {
		let fragment = '',
			fragmentName = '';
		let fields = params.fields ? fieldsToGql(params.fields) : false;
		if (!fields) {
			if (params.fragment) {
				if (params.fragment instanceof Fragment) {
					let fragmentObject = params.fragment.toString();
					fragment = fragmentObject.raw;
					fragmentName = fragmentObject.name;
					fields = `...${fragmentObject.name}`;
				} else if (typeof this.fragments[params.fragment] != 'undefined') {
					let fragmentObject = this.fragments[params.fragment].toString();
					fragment = fragmentObject.raw;
					fragmentName = fragmentObject.name;
					fields = `...${fragmentObject.name}`;
				} else {
					let fragmentObject = this.fragments.base.toString();
					fragment = fragmentObject.raw;
					fragmentName = fragmentObject.name;
					fields = `...${fragmentObject.name}`;
				}
			} else {
				let fragmentObject = this.fragments.base.toString();
				fragment = fragmentObject.raw;
				fragmentName = fragmentObject.name;
				fields = `...${fragmentObject.name}`;
			}
		}
		if (!fields) throw new Error('no returning fields specified');

		return { fragment, fragmentName, fields };
	}
}

module.exports = Table;
