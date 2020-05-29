const axios = require('axios');
const __ = require('../utils/helpers');

class Gql {
	constructor(parameters) {
		const defaultParameters = {
			graphqlUrl: null,
			adminSecret: null,
			hasuraRole: null,
			jwt: null,
			settings: {},
		};
		this.params = __.mergeDeep({}, defaultParameters, parameters);

		if (!this.params.graphqlUrl) {
			throw new Error('graphqlUrl is required');
		}

		if (typeof this.params.graphqlUrl !== 'string') {
			throw new TypeError('graphqlUrl must be Url format');
		}

		let headers = {
			'Content-Type': 'application/json',
		};
		if (this.params.adminSecret) {
			headers = {
				...headers,
				'X-Hasura-Role': 'admin',
				'x-hasura-admin-secret': this.params.adminSecret,
			};
		} else if (this.params.jwt) {
			headers = {
				...headers,
				'X-Hasura-Role': this.params.hasuraRole || 'user',
				Authorization: `Bearer ${this.params.jwt}`,
			};
		}

		this.$http = axios.create({
			baseURL: this.params.graphqlUrl,
			headers,
			json: true,
		});
	}

	async run({query, variables}) {
		const [err, {data} = {}] = await __.to(
			this.$http.request({
				method: 'POST',
				data: {
					query,
					variables,
				},
			}),
		);
		if (err) {
			return [err];
		}

		if (data.errors) {
			return [new Error(data.errors[0].message)];
		}

		return [null, data.data];
	}
}

module.exports = Gql;
