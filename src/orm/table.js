const Fragment = require('./fragment');
const Field = require('./field');
const {fieldsToGql, template} = require('../utils/builders');

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

		this.queryNameTemplate = template`${'literal'}_${'type'}_${this.params.name}`;
		this.queryTemplate = template`
			${this.params.name}${'table_postfix'} ${'arguments'} {
				${'fields'}
			}
		`;
		this.mutationTeamplate = template`
			${'table_prefix'}${this.params.name} ${'arguments'} {
				returning {
					${'fields'}
				}
			}
		`;
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
		const {fields, fragment, fragmentName, fragmentOperationArguments} = this.getFieldsFromParams(parameters);

		// Building for query or subscription
		const queryLiteral = parameters.queryType === 'query' ? 'Q' : 'S';

		var {variables, query_arguments, operation_arguments} = this.buildArguments(['where', 'limit', 'offset', 'order_by', 'distinct_on'], parameters, 's');

		const flatSetting = {
			[`${this.params.name}.select`]: `${this.params.name}`,
		};

		return {
			query: {
				name: this.queryNameTemplate({
					literal: queryLiteral,
					type: 's',
				}),
				arguments: [...operation_arguments, ...fragmentOperationArguments],
				flatSetting,
				fields: this.queryTemplate({
					table_postfix: '',
					arguments: query_arguments.length > 0 ? '(' + query_arguments.join(', ') + ')' : '',
					fields,
				}),
				fragment: {
					fragment,
					fragmentName,
				},
			},
			variables,
		};
	}

	build_aggregate(parameters) {
		const {fields, fragmentOperationArguments} = this.getFieldsFromAggregate(parameters);

		// Building for query or subscription
		const queryLiteral = parameters.queryType === 'query' ? 'Q' : 'S';

		var {variables, query_arguments, operation_arguments} = this.buildArguments(['where', 'limit', 'offset', 'order_by', 'distinct_on'], parameters, 'a');

		const flatSetting = {
			[`${this.params.name}.aggregate`]: `${this.params.name}_aggregate.aggregate`,
		};

		return {
			query: {
				name: this.queryNameTemplate({
					literal: queryLiteral,
					type: 'a',
				}),
				arguments: [...operation_arguments, ...fragmentOperationArguments],
				flatSetting,
				fields: this.queryTemplate({
					table_postfix: '_aggregate',
					arguments: query_arguments.length > 0 ? '(' + query_arguments.join(', ') + ')' : '',
					fields,
				}),
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
		const {fields, fragment, fragmentName, fragmentOperationArguments} = this.getFieldsFromParams(parameters);

		var {variables, query_arguments, operation_arguments} = this.buildArguments(['objects', 'on_conflict'], parameters, 'i');

		const flatSetting = {
			[`${this.params.name}.insert`]: `insert_${this.params.name}.returning`,
		};

		return {
			query: {
				name: this.queryNameTemplate({literal: 'M', type: 'i'}),
				flatSetting,
				arguments: [...operation_arguments, ...fragmentOperationArguments],
				fields: this.mutationTeamplate({
					table_prefix: 'insert_',
					arguments: `(${query_arguments.join(', ')})`,
					fields,
				}),
				fragment: {
					fragment,
					fragmentName,
				},
			},
			variables,
		};
	}

	build_update(parameters) {
		const {fields, fragment, fragmentName, fragmentOperationArguments} = this.getFieldsFromParams(parameters);

		var {variables, query_arguments, operation_arguments} = this.buildArguments(['where', '_set', '_inc'], parameters, 'u');

		const flatSetting = {
			[`${this.params.name}.update`]: `update_${this.params.name}.returning`,
		};

		return {
			query: {
				name: this.queryNameTemplate({literal: 'M', type: 'u'}),
				flatSetting,
				arguments: [...operation_arguments, ...fragmentOperationArguments],
				fields: this.mutationTeamplate({
					table_prefix: 'update_',
					arguments: `(${query_arguments.join(', ')})`,
					fields,
				}),
				fragment: {
					fragment,
					fragmentName,
				},
			},
			variables,
		};
	}

	build_delete(parameters) {
		const {fields, fragment, fragmentName, fragmentOperationArguments} = this.getFieldsFromParams(parameters);

		var {variables, query_arguments, operation_arguments} = this.buildArguments(['where'], parameters, 'd');

		const flatSetting = {
			[`${this.params.name}.delete`]: `delete_${this.params.name}.returning`,
		};

		return {
			query: {
				name: this.queryNameTemplate({literal: 'M', type: 'd'}),
				flatSetting,
				arguments: [...operation_arguments, ...fragmentOperationArguments],
				fields: this.mutationTeamplate({
					table_prefix: 'delete_',
					arguments: `(${query_arguments.join(', ')})`,
					fields,
				}),
				fragment: {
					fragment,
					fragmentName,
				},
			},
			variables,
		};
	}

	getFieldsFromParams(parameters) {
		let fields = '';
		let fragment = '';
		let fragmentName = '';
		let fragmentOperationArguments = [];
		const gqlFields = parameters.fields ? fieldsToGql(parameters.fields) : false;

		if (gqlFields) {
			fields = gqlFields.fields;
			fragmentOperationArguments = gqlFields.fragmentOperationArgument;
		}

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
			fragmentOperationArguments = fragmentObject.arguments;
		}

		if (!fields) {
			throw new Error('no returning fields specified');
		}

		return {fragment, fragmentName, fields, fragmentOperationArguments};
	}

	getFieldsFromAggregate(parameters) {
		let fields = '';
		let fragmentOperationArguments = [];
		const gqlFields = parameters.fields ? fieldsToGql(parameters.fields) : false;

		if (gqlFields) {
			fields = gqlFields.fields;
			fragmentOperationArguments = gqlFields.fragmentOperationArgument;
		}

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

					const {fields} = fieldsToGql(buildQuery);
					aggParameters.push(fields);
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
			fragmentOperationArguments,
		};
	}

	/* 
		ArgumentKeys = ['where', ...]
		type - d
	*/
	buildArguments(argumentKeys, parameters, type) {
		const argumentDict = {
			where: `${this.params.name}_bool_exp!`,
			limit: `Int`,
			offset: `Int`,
			order_by: `[${this.params.name}_order_by!]`,
			distinct_on: `[${this.params.name}_select_column!]`,
			objects: `[${this.params.name}_insert_input!]!`,
			on_conflict: `${this.params.name}_on_conflict`,
			_set: `${this.params.name}_set_input`,
			_inc: `${this.params.name}_inc_input`,
		};

		const variables = {};
		const query_arguments = [];
		const operation_arguments = [];
		argumentKeys.forEach((argumentKey) => {
			const argumentType = argumentDict[argumentKey];
			const variableKey = `${type}_${this.params.name}_${argumentKey}`;

			// We will generate arguments only if client request contains them
			if (parameters[argumentKey]) {
				// Fill variables to pass to query
				variables[variableKey] = parameters[argumentKey];
				// Query level arguments
				query_arguments.push(`${argumentKey}: $${variableKey}`);
				// Operation level variables definition
				operation_arguments.push(`$${variableKey}: ${argumentType}`);
			}
		});

		return {
			variables,
			query_arguments,
			operation_arguments,
		};
	}
}

module.exports = Table;
