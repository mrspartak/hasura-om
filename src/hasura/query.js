const axios = require('axios');
const __ = require('../utils/helpers');

class Query {
	constructor(parameters) {
		const defaultParameters = {
			queryUrl: null,
			adminSecret: null,
			settings: {},
		};
		this.params = __.mergeDeep({}, defaultParameters, parameters);

		if (!this.params.queryUrl) {
			throw new Error('queryUrl is required');
		}

		if (typeof this.params.queryUrl !== 'string') {
			throw new TypeError('queryUrl must be Url format');
		}

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

	async run(type, args) {
		if (!this.params.adminSecret) {
			throw new Error('adminSecret is required');
		}

		const [err, {data = null} = {}] = await __.to(
			this.$http.request({
				method: 'POST',
				data: {
					type,
					args,
				},
			}),
		);
		if (err) {
			return [err];
		}

		let result = [];
		if (type === 'run_sql') {
			const fields = data.result.shift();
			data.result.forEach((element) => {
				const temporary = {};
				element.forEach((value, index) => {
					temporary[fields[index]] = value;
				});
				result.push(temporary);
			});
		} else {
			result = data;
		}

		return [null, result];
	}
}

module.exports = Query;
