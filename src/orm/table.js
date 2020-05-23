const Fragment = require('./fragment');
const Field = require('./field');
const {fieldsToGql} = require('../utils/builders');

class Table {
	constructor(parameters) {
		const defaultParameters = {
			name: null,
			type: null,
		};

		this.params = Object.assign({}, defaultParameters, parameters);

		if (!this.params.name) {
			throw new Error('name is required');
		}

		this.fields = {};
		this.fragments = {};
	}

	init() {
		this.createFragment('base', this.fields);

		const pkeys = Object.keys(this.fields)
			.filter((key) => this.field(key).isPrimary)
			.reduce((result, key) => ((result[key] = this.field(key)), result), {});

		if (Object.keys(pkeys).length > 0) {
			this.createFragment('pk', pkeys);
		}
	}

	field(name) {
		if (typeof this.fields[name] === 'undefined') {
			throw new TypeError(`field ${name} not found`);
		}

		return this.fields[name];
	}

	setField(parameters) {
		this.fields[parameters.name] = new Field(parameters);
	}

	setPrimarykey(parameters) {
		if (typeof parameters === 'string') {
			parameters = {
				name: parameters,
			};
		}

		if (!parameters.name) {
			throw new Error('name is required');
		}

		this.field(parameters.name).isPrimary = true;
	}

	fragment(name = 'base') {
		if (typeof this.fragments[name] === 'undefined') {
			return false;
		}

		return this.fragments[name];
	}

	createFragment(name = 'base', fields = false) {
		if (Object.keys(this.fields).length === 0 || !fields) {
			throw new Error('No fields found to create fragment');
		}

		this.fragments[name] = new Fragment({
			table: this.params.name,
			name,
			fields: fields ? fields : this.fields,
		});
		return this.fragments[name];
	}

	/*
        Query_fields:
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
	buildQuery(parameters) {
		if (typeof parameters.select === 'undefined' && typeof parameters.aggregate === 'undefined') {
			parameters = {
				select: parameters,
			};
		}

		const queries = Object.keys(parameters);

		const toReturn = [];
		queries.forEach((queryName) => {
			const builtFuncName = `build_${queryName}`;
			if (typeof this[builtFuncName] !== 'function') {
				return;
			}

			toReturn.push(this[builtFuncName](parameters[queryName]));
		});

		return toReturn;
	}

	build_select(parameters) {
		const {fields, fragment, fragmentName} = this.getFieldsFromParams(parameters);

		const variables = {};
		const query_variables = [];
		const query_field_variables = [];

		const predifinedVariables = {
			where: {
				type(name) {
					return `${name}_bool_exp`;
				},
			},
			limit: {
				type() {
					return `Int`;
				},
			},
			offset: {
				type() {
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
			const varOptions = predifinedVariables[varName];

			const varKey = `${this.params.name}_${varName}`;

			if (parameters[varName]) {
				variables[varKey] = parameters[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOptions.type(this.params.name)}`);
			}
		});

		// Building for query or subscription
		const queryLiteral = parameters.queryType === 'query' ? 'Q' : 'S';

		const flatKey = `${this.params.name}.select`;
		const flatSetting = {};
		flatSetting[flatKey] = `${this.params.name}`;

		return {
			query: {
				name: `${queryLiteral}_${this.params.name}`,
				variables: query_variables,
				flatSetting,
				fields: `
                    ${this.params.name} ${query_field_variables.length > 0 ? '(' + query_field_variables.join(', ') + ')' : ''} {
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

	build_aggregate(parameters) {
		const {fields} = this.getFieldsFromAggregate(parameters);

		const variables = {};
		const query_variables = [];
		const query_field_variables = [];

		const predifinedVariables = {
			where: {
				type(name) {
					return `${name}_bool_exp`;
				},
			},
			limit: {
				type() {
					return `Int`;
				},
			},
			offset: {
				type() {
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
			const varOptions = predifinedVariables[varName];

			const varKey = `a_${this.params.name}_${varName}`;

			if (parameters[varName]) {
				variables[varKey] = parameters[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOptions.type(this.params.name)}`);
			}
		});

		// Building for query or subscription
		const queryLiteral = parameters.queryType === 'query' ? 'Q' : 'S';

		const flatKey = `${this.params.name}.aggregate`;
		const flatSetting = {};
		flatSetting[flatKey] = `${this.params.name}_aggregate.aggregate`;

		return {
			query: {
				name: `${queryLiteral}_${this.params.name}`,
				variables: query_variables,
				flatSetting,
				fields: `
                    ${this.params.name}_aggregate ${query_field_variables.length > 0 ? '(' + query_field_variables.join(', ') + ')' : ''} {
                        ${fields}
                    }
                `,
			},
			variables,
		};
	}

	// Mutation
	buildMutation(parameters) {
		const mutations = Object.keys(parameters);

		const toReturn = [];
		mutations.forEach((mutationName) => {
			const builtFuncName = `build_${mutationName}`;
			if (typeof this[builtFuncName] !== 'function') {
				return;
			}

			toReturn.push(this[builtFuncName](parameters[mutationName]));
		});

		return toReturn;
	}

	build_insert(parameters) {
		const {fields, fragment, fragmentName} = this.getFieldsFromParams(parameters);

		const variables = {};
		const query_variables = [];
		const query_field_variables = [];

		const predifinedVariables = {
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
			const varOptions = predifinedVariables[varName];

			const varKey = `i_${this.params.name}_${varName}`;

			if (parameters[varName]) {
				variables[varKey] = parameters[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOptions.type(this.params.name)}`);
			}
		});

		const flatKey = `${this.params.name}.insert`;
		const flatSetting = {};
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

	build_update(parameters) {
		const {fields, fragment, fragmentName} = this.getFieldsFromParams(parameters);

		const variables = {};
		const query_variables = [];
		const query_field_variables = [];

		const predifinedVariables = {
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
			const varOptions = predifinedVariables[varName];

			const varKey = `u_${this.params.name}_${varName}`;

			if (parameters[varName]) {
				variables[varKey] = parameters[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOptions.type(this.params.name)}`);
			}
		});

		const flatKey = `${this.params.name}.update`;
		const flatSetting = {};
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

	build_delete(parameters) {
		const {fields, fragment, fragmentName} = this.getFieldsFromParams(parameters);

		const variables = {};
		const query_variables = [];
		const query_field_variables = [];

		const predifinedVariables = {
			where: {
				type(name) {
					return `${name}_bool_exp!`;
				},
			},
		};

		Object.keys(predifinedVariables).forEach((varName) => {
			const varOptions = predifinedVariables[varName];

			const varKey = `d_${this.params.name}_${varName}`;

			if (parameters[varName]) {
				variables[varKey] = parameters[varName];
				query_field_variables.push(`${varName}: $${varKey}`);
				query_variables.push(`$${varKey}: ${varOptions.type(this.params.name)}`);
			}
		});

		const flatKey = `${this.params.name}.delete`;
		const flatSetting = {};
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

	getFieldsFromParams(parameters) {
		let fragment = '';
		let fragmentName = '';
		let fields = parameters.fields ? fieldsToGql(parameters.fields) : false;
		if (!fields) {
			let fInstance = null;
			if (typeof parameters.fragment === 'string') {
				fInstance = this.fragment(parameters.fragment);
			} else if (parameters.fragment instanceof Fragment) {
				fInstance = parameters.fragment;
			} else {
				fInstance = this.fragment('base');
			}

			if (!fInstance) {
				throw new Error('table do not contain any fragment');
			}

			const fragmentObject = fInstance.build();
			fragment = fragmentObject.raw;
			fragmentName = fragmentObject.name;
			fields = `...${fragmentObject.name}`;
		}

		if (!fields) {
			throw new Error('no returning fields specified');
		}

		return {fragment, fragmentName, fields};
	}

	getFieldsFromAggregate(parameters) {
		let fields = parameters.fields ? fieldsToGql(parameters.fields) : false;
		if (!fields) {
			const aggParameters = [];
			if (typeof parameters.count !== 'undefined') {
				const countConditions = [];
				if (typeof parameters.count.columns !== 'undefined') {
					countConditions.push(`columns: ${parameters.count.columns}`);
				}

				if (typeof parameters.count.distinct === 'boolean') {
					countConditions.push(`distinct: ${parameters.count.distinct}`);
				}

				aggParameters.push(`count${countConditions.length > 0 ? '(' + countConditions.join(',') + ')' : ''}`);
			}

			const fieldAggParameters = ['avg', 'max', 'min', 'stddev', 'stddev_pop', 'stddev_samp', 'sum', 'var_pop', 'var_samp', 'variance'];
			fieldAggParameters.forEach((aggParameter) => {
				if (typeof parameters[aggParameter] !== 'undefined') {
					const buildQuery = {};
					buildQuery[aggParameter] = {
						children: parameters[aggParameter],
					};
					aggParameters.push(fieldsToGql(buildQuery));
				}
			});

			fields = aggParameters.join('\n');
		}

		if (!fields) {
			throw new Error('no returning fields specified');
		}

		return {
			fields: `
				aggregate {
					${fields}
				}
			`,
		};
	}
}

module.exports = Table;
