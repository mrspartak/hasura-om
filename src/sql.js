const axios = require('axios');
const __ = require('./utils/helpers');

class Sql {
	constructor(params) {
		const defaultParams = {
			queryUrl: null,
			adminSecret: null,
		};
		this.params = Object.assign({}, defaultParams, params);

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

	async run(sql) {
		var [err, { data } = {}] = await __.to(
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
