const axios = require('axios');
const __ = require('../utils/helpers');

class Sql {
	/**
	 * @param {object} params
	 */
	constructor(params) {
		const defaultParams = {
			queryUrl: null,
			adminSecret: null,
		};
		this.params = Object.assign({}, defaultParams, params);

		if (!this.params.queryUrl) throw new Error('queryUrl is required');
		if (typeof this.params.queryUrl != 'string') throw new Error('queryUrl must be Url format');

		if (!this.params.adminSecret) throw new Error('adminSecret is required');

		this.$http = axios.create({
			baseURL: this.params.queryUrl,
			headers: {
				'Content-Type': 'application/json',
				'X-Hasura-Role': 'admin',
				'x-hasura-admin-secret': this.params.adminSecret,
			},
			json: true,
		});
	}

	/**
	 * @param {string} sql
	 */
	async run(sql) {
		var [err, { data = null } = {}] = await __.to(
			this.$http.request({
				method: 'POST',
				data: {
					type: 'run_sql',
					args: {
						sql,
					},
				},
			}),
		);
		if (err) return [err];

		let fields = data.result.shift();
		let result = [];
		data.result.forEach((el) => {
			let tmp = {};
			el.forEach((value, index) => {
				tmp[fields[index]] = value;
			});
			result.push(tmp);
		});

		return [null, result];
	}
}

module.exports = Sql;
