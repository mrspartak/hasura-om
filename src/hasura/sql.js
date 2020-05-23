const axios = require('axios');
const __ = require('../utils/helpers');

class Sql {
    /**
     * @param {object} params
     */
    constructor(parameters) {
        const defaultParameters = {
            queryUrl: null,
            adminSecret: null,
        };
        this.params = Object.assign({}, defaultParameters, parameters);

        if (!this.params.queryUrl) {
            throw new Error('queryUrl is required');
        }

        if (typeof this.params.queryUrl !== 'string') {
            throw new TypeError('queryUrl must be Url format');
        }

        if (!this.params.adminSecret) {
            throw new Error('adminSecret is required');
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

    /**
     * @param {string} sql
     */
    async run(sql) {
        const [err, { data = null } = {}] = await __.to(
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
        if (err) {
            return [err];
        }

        const fields = data.result.shift();
        const result = [];
        data.result.forEach((element) => {
            const temporary = {};
            element.forEach((value, index) => {
                temporary[fields[index]] = value;
            });
            result.push(temporary);
        });

        return [null, result];
    }
}

module.exports = Sql;
