const Sql = require('./sql');
const Gql = require('./gql');
const Table = require('./table');
const Fragment = require('./gql/fragment');
const __ = require('./utils/helpers');

class Hasura {
	constructor(params) {
		const defaultParams = {
			graphqlUrl: null,
			queryUrl: null,
			adminSecret: null,
		};
		this.params = Object.assign({}, defaultParams, params);

		if (!this.params.graphqlUrl) throw new Error('graphqlUrl is required');
		if (typeof this.params.graphqlUrl != 'string') throw new Error('graphqlUrl must be Url format');

		if (!this.params.adminSecret) throw new Error('adminSecret is required');

		if (!this.params.queryUrl) this.params.queryUrl = this.params.graphqlUrl.replace('/v1/graphql', '/v1/query');

		this.$sql = new Sql(this.params);
		this.$gql = new Gql(this.params);

		this.INITIATED = false;
		this.tables = {};
	}

	async init() {
		//get tables
		var [err, data] = await this.$sql.run(`
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema='public';
        `);
		if (err) throw err;

		data.forEach((row) => {
			this.tables[row.table_name] = new Table({
				name: row.table_name,
				type: row.table_type,
			});
		});

		//get table fields
		var [err, data] = await this.$sql.run(`
            SELECT table_name, column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = 'public';
        `);
		if (err) throw err;

		data.forEach((row) => {
			this.tables[row.table_name].setField({
				name: row.column_name,
				type: row.data_type,
				udt: row.udt_name,
			});
		});

		//get primary keys
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
		if (err) throw err;

		data.forEach((row) => {
			this.tables[row.table_name].setPrimarykey({
				name: row.key_column,
				position: row.position,
			});
		});

		Object.keys(this.tables).forEach((tableName) => {
			this.tables[tableName].init();
		});

		this.INITIATED = true;
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
	async query(params, { flatOne = true } = {}) {
		try {
			var [query, variables] = this.buildQuery(params);
		} catch (err) {
			return [err];
		}

		var [err, response] = await this.$gql.run({
			query,
			variables,
		});
		if (err) return [err];

		//return flatten object
		if (Object.keys(params).length == 1 && flatOne) return [null, response[Object.keys(params)[0]]];

		return [null, response];
	}

	buildQuery(params) {
		let tables = Object.keys(params);

		let queryName = [],
			queryVariables = [],
			queryFields = [],
			queryFragments = {};
		let variables = {};

		let builds = [];
		tables.forEach((tableName) => {
			let built = this.tables[tableName].buildQuery({
				...params[tableName],
				tableName,
			});

			queryName.push(built.query.name);
			queryVariables.push(...built.query.variables);
			queryFields.push(built.query.fields);
			queryFragments[built.query.fragment.fragmentName] = built.query.fragment.fragment;
			variables = Object.assign({}, variables, built.variables);
		});

		let query = `
            ${Object.values(queryFragments).join('\n')}
            query ${queryName.join('_')} (${queryVariables.join(', ')}) {
                ${queryFields.join('\n')}
            }
        `;

		return [query, variables];
	}

	/* 
        {
            [table_name]: {
                insert: {},
                update: {},
                delete: {}
            }
        }
    */
	async mutate(params) {
		try {
			var [query, variables, flatSettings] = this.buildMutation(params);
		} catch (err) {
			return [err];
		}

		var [err, response] = await this.$gql.run({
			query,
			variables,
		});
		if (err) return [err];

		let toReturn = {};
		flatSettings.forEach((flat) => {
			flat = Object.entries(flat)[0];
			let value = flat[1].split('.').reduce((o, i) => o[i], response);

			__.objectFromPath(toReturn, flat[0], value);
		});

		return [null, toReturn];
	}

	buildMutation(params) {
		let tables = Object.keys(params);

		let queryName = [],
			queryVariables = [],
			queryFields = [],
			queryFragments = {},
			queryFlatSetting = [];
		let variables = {};

		let builds = [];
		tables.forEach((tableName) => {
			let builts = this.tables[tableName].buildMutation({
				...params[tableName],
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

			console.log('queryFlatSetting', queryFlatSetting);
		});

		let query = `
            ${Object.values(queryFragments).join('\n')}
            mutation ${queryName.join('_')} (${queryVariables.join(', ')}) {
                ${queryFields.join('\n')}
            }
        `;

		return [query, variables, queryFlatSetting];
	}
}

exports.Hasura = Hasura;
exports.Table = Table;
exports.Fragment = Fragment;
