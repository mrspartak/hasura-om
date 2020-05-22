const __ = require('../utils/helpers');
const ws = require('ws');
const { SubscriptionClient } = require('subscriptions-transport-ws');

class WsGql {
	constructor(params) {
		const defaultParams = {
			wsUrl: null,
			adminSecret: null,
			reconnect: true,
			lazy: true,
		};
		this.params = Object.assign({}, defaultParams, params);

		if (!this.params.wsUrl) throw new Error('wsUrl is required');
		if (typeof this.params.wsUrl != 'string') throw new Error('wsUrl must be Url format');

		if (!this.params.adminSecret) throw new Error('adminSecret is required');

		this.client = new SubscriptionClient(
			this.params.wsUrl,
			{
				reconnect: this.params.reconnect,
				lazy: this.params.lazy,
				connectionParams: {
					headers: {
						'X-Hasura-Role': 'admin',
						'x-hasura-admin-secret': this.params.adminSecret,
					},
				},
			},
			ws,
		);

		/* this.client.on('connected', (data) => {
            console.log('client connected', data)
        })
        this.client.on('reconnected', (data) => {
            console.log('client reconnected', data)
        })
        this.client.on('connecting', (data) => {
            console.log('client connecting', data)
        })
        this.client.on('reconnecting', (data) => {
            console.log('client reconnecting', data)
        })
        this.client.on('disconnected', (data) => {
            console.log('client disconnected', data)
        })
        this.client.on('error', (data) => {
            console.log('client error', data.message)
        }) */
	}

	run({ query, variables, callback, settings = {}, flat = (data) => data }) {
		if (typeof query != 'string') throw new Error('query must be a string');
		if (typeof callback != 'function') throw new Error('callback must be a function');

		let { subscribe } = this.client.request({
			query,
			variables,
		});

		let { unsubscribe } = subscribe({
			next(data) {
				callback([null, flat(data.data)]);
			},
			error(err) {
				callback([err]);
			},
			complete() {
				//console.log('SUB COMPLETED')
			},
		});

		return unsubscribe;
	}
}

module.exports = WsGql;
