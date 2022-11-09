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

describe('FactGenerator._resolveFacts tests', () => {

    it('returns empty map when no fact specifications are specified', () => {
        const factGenerator = new FactGenerator();
        return factGenerator._resolveFacts({}, [], {})
            .then(factMap => {
                assert.ok(factMap);
                assert.strictEqual(factMap.size, 0);
            });
    });

    it('resolves facts according to specifications', () => {
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

        factGenerator._resolveFacts({}, factSpecifications, input)
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

            factGenerator._resolveFacts({}, factSpecifications, input)
                .then(factMap => {
                    assert.strictEqual(factMap.get('foo')[0], 1);
                });
        });
});