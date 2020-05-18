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

	async run({ query, variables, callback, settings } = {}) {
		let { subscribe } = this.client.request({
			query,
			variables,
		});

		let { unsubscribe } = subscribe({
			next(data) {
				callback([null, settings.flatOne ? data.data[settings.flatOne] : data.data]);
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
