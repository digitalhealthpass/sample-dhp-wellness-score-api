/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

/* eslint-disable indent */
const assert = require('assert');
const {
    FactGenerator
} =
require('../../../../services/FactGenerator');

describe('FactGenerator._preProcessInput tests', () => {

    it('rejects when pre-process config is invalid', (done) => {
        const factGenerator = new FactGenerator();
        factGenerator._preProcessInput(null, {})
            .then(() => {
                done(new Error('expected an error'));
            })
            .catch(() => {
                done();
            });
    });

    it('rejects when input is invalid', (done) => {
        const factGenerator = new FactGenerator();
        factGenerator._preProcessInput({}, {})
            .then(() => {
                done(new Error('expected an error'));
            })
            .catch(() => {
                done();
            });
    });

    it('sorts lists according to pre-processing configuration', () => {

        const foo = [{
                val: 1
            },
            {
                val: 2
            },
            {
                val: 3
            },
        ];

        const bar = [{
                val: 6
            },
            {
                val: 5
            },
            {
                val: 4
            },
        ];

        const input = {
            foo,
            bar,
        };

        const preProcessingConfig = {
            natural_sort: {
                enabled: true,
                targets: [{
                    name: 'foo',
                    sort_field: 'val',
                    direction: 'desc',
                }, {
                    name: 'bar',
                    sort_field: 'val',
                    direction: 'asc',
                }],
            },
        };

        const factGenerator = new FactGenerator();
        return factGenerator._preProcessInput(preProcessingConfig, input)
            .then(preProcessedInput => {
                assert.deepEqual(preProcessedInput.foo, foo.reverse());
                assert.deepEqual(preProcessedInput.bar, bar.reverse());
            });
    });

});