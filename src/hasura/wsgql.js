const EventEmitter = require('events');
const ws = require('ws');
const {SubscriptionClient} = require('subscriptions-transport-ws');
const {mergeDeep} = require('../utils/helpers');

class WsGql extends EventEmitter {
	constructor(parameters) {
		super();

		const defaultParameters = {
			wsUrl: null,
			adminSecret: null,
			jwt: null,
			hasuraRole: null,
			settings: {
				reconnect: true,
				lazy: true,
				webSocketImpl: ws,
			},
		};
		this.params = mergeDeep({}, defaultParameters, parameters);

		if (!this.params.wsUrl) {
			throw new Error('wsUrl is required');
		}

		if (typeof this.params.wsUrl !== 'string') {
			throw new TypeError('wsUrl must be Url format');
		}

		let headers = {};
		if (this.params.adminSecret) {
			headers = {
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

		this.client = new SubscriptionClient(
			this.params.wsUrl,
			{
				reconnect: this.params.settings.reconnect,
				lazy: this.params.settings.lazy,
				connectionParams: {
					headers,
				},
			},
			this.params.settings.webSocketImpl,
		);

		this.client.on('connecting', () => {
			this.emit('connecting');
		});
		this.client.on('connected', () => {
			this.emit('connected');
		});
		this.client.on('reconnected', () => {
			this.emit('reconnected');
		});
		this.client.on('reconnecting', () => {
			this.emit('reconnecting');
		});
		this.client.on('disconnected', () => {
			this.emit('disconnected');
		});
		this.client.on('error', (error) => {
			this.emit('error', error);
		});
	}

	updateParams(parameters) {
		this.params = mergeDeep({}, this.params, parameters);
	}

	run({query, variables, callback, flat = (data) => data}) {
		if (typeof query !== 'string') {
			throw new TypeError('query must be a string');
		}

		if (typeof callback !== 'function') {
			throw new TypeError('callback must be a function');
		}

		const {subscribe} = this.client.request({
			query,
			variables,
		});

		const {unsubscribe} = subscribe({
			next(data) {
				callback([null, flat(data.data)]);
			},
			error(err) {
				callback([err]);
			},
			complete() {
				// Console.log('SUB COMPLETED')
			},
		});

		return unsubscribe;
	}
}

module.exports = WsGql;
