class Field {
	constructor(params) {
		const defaultParams = {
			name: null,
			type: null,
			isPrimary: false,
		};

		if (typeof params == 'undefined') throw new Error('input is required');

		if (typeof params == 'string')
			params = {
				name: params,
			};

		this.params = Object.assign({}, defaultParams, params);

		if (!this.params.name) throw new Error('name is required');
	}

	get name() {
		return this.params.name;
	}
	get type() {
		return this.params.type;
	}
	get isPrimary() {
		return this.params.isPrimary;
	}

	set type(value) {
		this.params.type = value;
	}
	set isPrimary(value) {
		this.params.isPrimary = !!value;
	}
}

module.exports = Field;
