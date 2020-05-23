const Sql = require('../hasura/sql');
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
			query: {
				/*
					Tries to flat object parenting
					user.select.[] -> []
					user{select: [], aggregate: {}} -> {select: [], aggregate: {}}
				*/
				flatOne: true,
			},
			subscription: {
				flatOne: true,
			},
			mutation: {
				flatOne: true,
			},
		};
		this.params = __.mergeDeep({}, defaultParameters, parameters);

		if (!this.params.graphqlUrl) {
			throw new Error('graphqlUrl is required');
		}

		if (typeof this.params.graphqlUrl !== 'string') {
			throw new TypeError('graphqlUrl must be Url format');
		}

		if (!this.params.adminSecret) {
			throw new Error('adminSecret is required');
		}

		if (!this.params.queryUrl) {
			this.params.queryUrl = this.params.graphqlUrl.replace('/v1/graphql', '/v1/query');
		}

		if (!this.params.wsUrl) {
			this.params.wsUrl = this.params.graphqlUrl.replace('http://', 'ws://').replace('https://', 'wss://');
		}

		this.$sql = new Sql(this.params);
		this.$gql = new Gql(this.params);
		this.$ws = new WsGql(this.params);

		this.INITIATED = false;
		this.tables = {};
	}

	async init() {
		// Get tables
		var [err, data] = await this.$sql.run(`
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema='public';
        `);
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
		var [err, data] = await this.$sql.run(`
            SELECT table_name, column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = 'public';
        `);
		if (err) {
			throw err;
		}

		data.forEach((row) => {
			this.table(row.table_name).setField({
				name: row.column_name,
				type: row.data_type,
				udt: row.udt_name,
			});
		});

		// Get primary keys
		var [err, data] = await this.$sql.run(`
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
        `);
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
			this.table(tableName).init();
		});

		this.INITIATED = true;
	}

	table(name) {
		if (typeof this.tables[name] === 'undefined') {
			throw new TypeError(`table ${name} not found`);
		}

		return this.tables[name];
	}

	createTable({name, type} = {}) {
		this.tables[name] = new Table({name, type});
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
			params: parameters,
		})(response);

		return [null, toReturn];
	}

	buildQuery(parameters, queryType = 'query') {
		const tables = Object.keys(parameters);

		const queryName = [];
		const queryVariables = [];
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

			builts.forEach((built) => {
				queryName.push(built.query.name);
				queryVariables.push(...built.query.variables);
				queryFields.push(built.query.fields);
				if (built.query.fragment) {
					queryFragments[built.query.fragment.fragmentName] = built.query.fragment.fragment;
				}

				queryFlatSetting.push(built.query.flatSetting);
				variables = Object.assign({}, variables, built.variables);
			});

			/* QueryName.push(built.query.name);
			queryVariables.push(...built.query.variables);
			queryFields.push(built.query.fields);
			queryFragments[built.query.fragment.fragmentName] = built.query.fragment.fragment;
			variables = Object.assign({}, variables, built.variables); */
		});

		const query = `
            ${Object.values(queryFragments).join('\n')}
            ${queryType} ${queryName.join('_')} ${queryVariables.length > 0 ? '(' + queryVariables.join(', ') + ')' : ''} {
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
			params: parameters,
		})(response);

		return [null, toReturn];
	}

	buildMutation(parameters) {
		const tables = Object.keys(parameters);

		const queryName = [];
		const queryVariables = [];
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
				queryName.push(built.query.name);
				queryVariables.push(...built.query.variables);
				queryFields.push(built.query.fields);
				queryFragments[built.query.fragment.fragmentName] = built.query.fragment.fragment;
				queryFlatSetting.push(built.query.flatSetting);
				variables = Object.assign({}, variables, built.variables);
			});
		});

		const query = `
            ${Object.values(queryFragments).join('\n')}
            mutation ${queryName.join('_')} (${queryVariables.join(', ')}) {
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
			params: parameters,
		});

		const unsub = this.$ws.run({
			query,
			variables,
			callback,
			flat,
		});

		return unsub; // Unsubscribe
	}

	flatGqlResponse({flatSettings, settings, params}) {
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
				}
			});

			// Return flatten object
			if (Object.keys(params).length === 1 && settings.flatOne) {
				toReturn = toReturn[Object.keys(params)[0]];
			}

			return toReturn;
		};
	}
}

module.exports = Hasura;
