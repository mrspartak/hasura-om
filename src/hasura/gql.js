const axios = require('axios');
const __ = require('../utils/helpers');

class Gql {
	constructor(params) {
		const defaultParams = {
			graphqlUrl: null,
			adminSecret: null,
		};
		this.params = Object.assign({}, defaultParams, params);

		this.$http = axios.create({
			baseURL: this.params.graphqlUrl,
			headers: {
				'Content-Type': 'application/json',
				'X-Hasura-Role': 'admin',
				'x-hasura-admin-secret': this.params.adminSecret,
			},
			json: true,
		});
	}

	async run({ query, variables } = {}) {
		var [err, { data } = {}] = await __.to(
			this.$http.request({
				method: 'POST',
				data: {
					query,
					variables,
				},
			}),
		);
		if (err) return [err];
		if (data.errors) return [new Error(data.errors[0].message)];

		return [null, data.data];
	}
}

module.exports = Gql;
