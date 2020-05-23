class Field {
	constructor(parameters) {
		const defaultParameters = {
			name: null,
			type: null,
			isPrimary: false,
		};

		if (typeof parameters === 'undefined') {
			throw new TypeError('input is required');
		}

		if (typeof parameters === 'string') {
			parameters = {
				name: parameters,
			};
		}

		this.params = Object.assign({}, defaultParameters, parameters);

		if (!this.params.name) {
			throw new Error('name is required');
		}
	}

	get name() {
		return this.params.name;
	}

	get type() {
		return this.params.type;
	}

	set type(value) {
		this.params.type = value;
	}

	get isPrimary() {
		return this.params.isPrimary;
	}

	set isPrimary(value) {
		this.params.isPrimary = Boolean(value);
	}
}

module.exports = Field;
