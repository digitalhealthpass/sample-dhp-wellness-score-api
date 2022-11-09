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
} = require('../../../../services/FactGenerator');

// eslint-disable-next-line max-lines-per-function
describe('FactGenerator.generateMap tests', () => {
    it('rejects when input is not valid', (done) => {
        const factGenerator = new FactGenerator();
        factGenerator.generateMap({}, null, [], {})
            .then(() => {
                done(new Error('expected an error'));
            })
            .catch(() => {
                done();
            });
    });

    it('resolves pre-processes input and resolves facts' +
        ' according to specifications', () => {

            const factGenerator = new FactGenerator();

            const factSpecifications = [{
                name: 'barVal',
                selectors: [
                    '$.foo[0].bar',
                ],
            }, {
                name: 'barValPlus7',
                expression: 'barVal[0] + 7',
            },];

            const input = {
                foo: [{
                    bar: 1
                }, {
                    bar: 2
                }, {
                    bar: 3
                }],
            };

            const preProcessingConfig = {
                natural_sort: {
                    enabled: true,
                    targets: [{
                        name: 'foo',
                        sort_field: 'bar',
                        direction: 'desc',
                    },],
                },
            };

            factGenerator.generateMap(preProcessingConfig, null,
                factSpecifications, input)
                .then(factMap => {
                    assert.strictEqual(factMap.get('barValPlus7'), 10);
                });
        });

    it('resolves facts and evaluate expression', () => {
        const factGenerator = new FactGenerator();

        const factSpecifications = [{
            name: 'barVal',
            expression: '11',
        }, {
            name: 'NewbarVal',
            expression: "barVal + 7",
        },];

        const input = {
            foo: 1,
        };

        factGenerator.generateMap({}, null,
            factSpecifications, input)
            .then(factMap => {
                assert.strictEqual(factMap.get('NewbarVal'), 18);
            });
    });


    it('resolves factspec according to specifications', () => {

        const factGenerator = new FactGenerator();

        const factSpecifications = [{
            name: 'foo',
            selectors: [
                '$.foo',
            ],
        },
        {
            name: 'bar',
            selectors: [
                '$.bar',
            ],
        }
        ];

        const input = {
            foo: 1,
            bar: 2,
        };

        factGenerator.generateMap({}, null, factSpecifications, input)
            .then(factMap => {
                assert.strictEqual(factMap.get('foo')[0], 1);
                assert.strictEqual(factMap.get('bar')[0], 2);
            });
    });

    it('resolves facts from cache if the same fact has previously been resolved',
        () => {

            const factGenerator = new FactGenerator();

            const factSpecifications = [{
                name: 'foo',
                selectors: [
                    '$.foo',
                ],
            },
            {
                name: 'foo',
                selectors: [
                    'invalid jsonpath', // this should not get executed
                    // because the value of "foo"
                    // should be pulled from cache
                ],
            }
            ];

            const input = {
                foo: 1,
                bar: 2,
            };

            factGenerator.generateMap({}, null, factSpecifications, input)
                .then(factMap => {
                    assert.strictEqual(factMap.get('foo')[0], 1);
                });
        });

});