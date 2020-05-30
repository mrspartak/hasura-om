const Query = require('../hasura/query');
const Gql = require('../hasura/gql');
const WsGql = require('../hasura/wsgql');
const Table = require('./table');
const __ = require('../utils/helpers');

class Hasura {
	constructor(parameters) {
		const defaultParameters = {
			graphqlUrl: null,
			queryUrl: null,
			wsUrl: null,
			adminSecret: null,
			hasuraRole: null,
			jwt: null,
			query: {
				/*
					Tries to flat object parenting
					user.select.[] -> []
					user{select: [], aggregate: {}} -> {select: [], aggregate: {}}
				*/
				flatOne: true,
				/* 
					Returns first array entry
				*/
				getFirst: false,
			},
			subscription: {
				flatOne: true,
				/* 
					Returns first array entry
				*/
				getFirst: false,
			},
			mutation: {
				flatOne: true,
				/* 
					Returns first array entry
				*/
				getFirst: false,
			},
			sqlConnectionSettings: {},
			gqlConnectionSettings: {},
			wsConnectionSettings: {
				lazy: true,
				reconnect: true,
			},
		};
		this.params = __.mergeDeep({}, defaultParameters, parameters);

		if (!this.params.graphqlUrl) {
			throw new Error('graphqlUrl is required');
		}

		if (typeof this.params.graphqlUrl !== 'string') {
			throw new TypeError('graphqlUrl must be Url format');
		}

		if (!this.params.queryUrl) {
			this.params.queryUrl = this.params.graphqlUrl.replace('/v1/graphql', '/v1/query');
		}

		if (!this.params.wsUrl) {
			this.params.wsUrl = this.params.graphqlUrl.replace('http://', 'ws://').replace('https://', 'wss://');
		}

		// Hasura meta API endpoint
		this.$query = new Query({
			queryUrl: this.params.queryUrl,
			adminSecret: this.params.adminSecret,
			settings: this.params.sqlConnectionSettings,
		});

		// Hasura Graphql endpoint
		this.$gql = new Gql({
			graphqlUrl: this.params.graphqlUrl,
			adminSecret: this.params.adminSecret,
			hasuraRole: this.params.hasuraRole,
			jwt: this.params.jwt,
			settings: this.params.gqlConnectionSettings,
		});

		// Hasura subscription WS endpoint
		this.$ws = new WsGql({
			wsUrl: this.params.wsUrl,
			adminSecret: this.params.adminSecret,
			hasuraRole: this.params.hasuraRole,
			jwt: this.params.jwt,
			settings: this.params.wsConnectionSettings,
		});

		this.tables = {};
	}

	updateParams(parameters) {
		this.params = __.mergeDeep({}, this.params, parameters);

		this.$query.updateParams({
			queryUrl: this.params.queryUrl,
			adminSecret: this.params.adminSecret,
			settings: this.params.sqlConnectionSettings,
		});
		this.$gql.updateParams({
			graphqlUrl: this.params.graphqlUrl,
			adminSecret: this.params.adminSecret,
			hasuraRole: this.params.hasuraRole,
			jwt: this.params.jwt,
			settings: this.params.gqlConnectionSettings,
		});
		this.$ws.updateParams({
			wsUrl: this.params.wsUrl,
			adminSecret: this.params.adminSecret,
			hasuraRole: this.params.hasuraRole,
			jwt: this.params.jwt,
			settings: this.params.wsConnectionSettings,
		});
	}

	async init() {
		console.warn('this method is changed! Please use generateTablesFromAPI instead');
		await this.generateTablesFromAPI();
	}

	async generateTablesFromAPI() {
		// Get tables
		var [err, data] = await this.$query.run('run_sql', {
			sql: `
				SELECT table_name, table_type
				FROM information_schema.tables
				WHERE table_schema='public';
			`,
		});
		if (err) {
			throw err;
		}

		data.forEach((row) => {
			this.createTable({
				name: row.table_name,
				type: row.table_type,
			});
		});

		// Get table fields
		var [err, data] = await this.$query.run('run_sql', {
			sql: `
				SELECT table_name, column_name, data_type, udt_name
				FROM information_schema.columns
				WHERE table_schema = 'public';
			`,
		});
		if (err) {
			throw err;
		}

		data.forEach((row) => {
			this.table(row.table_name).createField({
				name: row.column_name,
				type: row.data_type,
				udt: row.udt_name,
			});
		});

		// Get primary keys
		var [err, data] = await this.$query.run('run_sql', {
			sql: `
				select
					kcu.table_name,
					tco.constraint_name,
					kcu.ordinal_position as position,
					kcu.column_name as key_column
				from information_schema.table_constraints tco
				join information_schema.key_column_usage kcu 
					on kcu.constraint_name = tco.constraint_name
					and kcu.constraint_schema = tco.constraint_schema
					and kcu.constraint_name = tco.constraint_name
				where tco.constraint_type = 'PRIMARY KEY' AND kcu.table_schema = 'public'
				order by kcu.table_schema, kcu.table_name, position;
			`,
		});
		if (err) {
			throw err;
		}

		data.forEach((row) => {
			this.table(row.table_name).setPrimarykey({
				name: row.key_column,
				position: row.position,
			});
		});

		Object.keys(this.tables).forEach((tableName) => {
			this.table(tableName).generateBaseFragments();
		});
	}

	table(name) {
		if (typeof this.tables[name] === 'undefined') {
			throw new TypeError(`table ${name} not found`);
		}

		return this.tables[name];
	}

	createTable({name, type} = {}) {
		this.tables[name] = new Table({name, type});

		return this.table(name);
	}

	/*
        {
            [table_name]: {
                where
                order_by
                limit
                offset
                distinct_on

                fields
                fragment
            }
        }
    */
	async query(parameters, settings = {}) {
		try {
			var [query, variables, flatSettings] = this.buildQuery(parameters);
		} catch (error) {
			return [error];
		}

		// Console.log(query);

		settings = __.mergeDeep({}, this.params.query, settings);

		const [err, response] = await this.$gql.run({
			query,
			variables,
		});
		if (err) {
			return [err];
		}

		const toReturn = this.flatGqlResponse({
			flatSettings,
			settings,
			parameters,
		})(response);

		return [null, toReturn];
	}

	buildQuery(parameters, queryType = 'query') {
		const tables = Object.keys(parameters);

		const operationName = [];
		const operationArguments = [];
		const queryFields = [];
		const queryFragments = {};
		const queryFlatSetting = [];
		let variables = {};

		tables.forEach((tableName) => {
			const builts = this.table(tableName).buildQuery({
				...parameters[tableName],
				tableName,
				queryType,
			});

			variables = Object.assign({}, parameters[tableName].variables);

			builts.forEach((built) => {
				operationName.push(built.query.name);
				operationArguments.push(...built.query.arguments);

				queryFields.push(built.query.fields);
				if (built.query.fragment) {
					queryFragments[built.query.fragment.fragmentName] = built.query.fragment.fragment;
				}

				queryFlatSetting.push(built.query.flatSetting);
				variables = Object.assign({}, variables, built.variables);
			});
		});

		/* 	
			//!queryFragments[]
			fragment pk_fragment_user on user {
				id
			}
			
			//!queryType - query | subscription
			//!operationName - [S_s_user, S_a_user]
			//!operationArguments - [$user_where: user_bool_exp]
			query S_s_user_S_a_user($user_where: user_bool_exp) {
			
				//!queryFields - [user , user_aggregate]
				user(where: $user_where) {
					...pk_fragment_user
				}
				user_aggregate {
					aggregate {
						count
						sum {
							id
							money
						}
					}
				}
			}
		*/
		const query = `
            ${Object.values(queryFragments).join('\n')}
            ${queryType} ${operationName.join('_')} ${operationArguments.length > 0 ? '(' + operationArguments.join(', ') + ')' : ''} {
                ${queryFields.join('\n')}
            }
		`;

		return [query, variables, queryFlatSetting];
	}

	/*
        {
            [table_name]: {
                insert: {
					objects

					fields
                	fragment
				},
                update: {
					where
					_set
					_inc

					fields
                	fragment
				},
                delete: {
					where

					fields
                	fragment
				}
            }
        }
    */
	async mutate(parameters, settings = {}) {
		try {
			var [query, variables, flatSettings] = this.buildMutation(parameters);
		} catch (error) {
			return [error];
		}

		settings = __.mergeDeep({}, this.params.mutation, settings);

		const [err, response] = await this.$gql.run({
			query,
			variables,
		});
		if (err) {
			return [err];
		}

		const toReturn = this.flatGqlResponse({
			flatSettings,
			settings,
			parameters,
		})(response);

		return [null, toReturn];
	}

	buildMutation(parameters) {
		const tables = Object.keys(parameters);

		const operationName = [];
		const operationArguments = [];
		const queryFields = [];
		const queryFragments = {};
		const queryFlatSetting = [];
		let variables = {};

		tables.forEach((tableName) => {
			const builts = this.tables[tableName].buildMutation({
				...parameters[tableName],
				tableName,
			});

			builts.forEach((built) => {
				operationName.push(built.query.name);
				operationArguments.push(...built.query.arguments);

				queryFields.push(built.query.fields);
				queryFragments[built.query.fragment.fragmentName] = built.query.fragment.fragment;
				queryFlatSetting.push(built.query.flatSetting);
				variables = Object.assign({}, variables, built.variables);
			});
		});

		const query = `
            ${Object.values(queryFragments).join('\n')}
            mutation ${operationName.join('_')} (${operationArguments.join(', ')}) {
                ${queryFields.join('\n')}
            }
        `;

		return [query, variables, queryFlatSetting];
	}

	subscribe(parameters, callback, settings = {}) {
		try {
			var [query, variables, flatSettings] = this.buildQuery(parameters, 'subscription');
		} catch (error) {
			return [error];
		}

		settings = __.mergeDeep({}, this.params.query, settings);

		const flat = this.flatGqlResponse({
			flatSettings,
			settings,
			parameters,
		});

		const unsub = this.$ws.run({
			query,
			variables,
			callback,
			flat,
		});

		return unsub; // Unsubscribe
	}

	async subscribeToMore(parameters, callback, settings = {}) {
		settings = __.mergeDeep(
			{
				skipFirst: true,
			},
			this.params.query,
			settings,
		);

		callback(await this.query(parameters, settings));

		let skippedFirst = !settings.skipFirst;
		const subSettings = __.mergeDeep({}, this.params.subscribe, settings);
		return this.subscribe(
			parameters,
			(response) => {
				if (skippedFirst === true) {
					callback(response);
				} else {
					skippedFirst = true;
				}
			},
			subSettings,
		);
	}

	/* 
		Settings
			flatOne
			getFirst
	*/
	flatGqlResponse({flatSettings, settings, parameters}) {
		return function (response) {
			let toReturn = {};

			flatSettings.forEach((flat) => {
				// With the request we pass flatSettings: { 'request_path': 'hasura_path' }
				flat = Object.entries(flat)[0];

				// Getting Hasura's response by hasura_path
				const value = flat[1].split('.').reduce((o, i) => o[i], response);

				// Creating new object by request_path and placing the result
				__.objectFromPath(toReturn, flat[0], value);
			});

			Object.keys(toReturn).forEach((tableName) => {
				if (Object.keys(toReturn[tableName]).length === 1 && settings.flatOne) {
					toReturn[tableName] = toReturn[tableName][Object.keys(toReturn[tableName])[0]];
					if (Array.isArray(toReturn[tableName]) && settings.getFirst) toReturn[tableName] = toReturn[tableName].shift();
				}
			});

			// Return flatten object
			if (Object.keys(parameters).length === 1 && settings.flatOne) {
				toReturn = toReturn[Object.keys(parameters)[0]];
				if (Array.isArray(toReturn) && settings.getFirst) toReturn = toReturn.shift();
			}

			return toReturn;
		};
	}
}

module.exports = Hasura;
