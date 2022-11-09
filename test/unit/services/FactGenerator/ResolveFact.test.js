/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

/* eslint-disable indent, max-classes-per-file */
const assert = require('assert');
const {
    FactGenerator
} = require('../../../../services/FactGenerator');
const Config = require('../../../../config/config');

// eslint-disable-next-line max-lines-per-function
describe('FactGenerator._resolveFact tests', () => {

    it('returns object with 1 selector', (done) => {
        const factGenerator = new FactGenerator();
        const factSpecification = {
            name: 'test_fact',
            selectors: [
                '$.foo',
            ],
        };
        const input = {
            foo: 1,
        };

        try {
            const value = factGenerator._resolveFact(factSpecification, input);
            assert.strictEqual(input.foo, value[0]);
            done();
        } catch (err) {
            done(err);
        }
    });

    it('returns list with 1 selector', (done) => {
        const factGenerator = new FactGenerator();
        const factSpecification = {
            name: 'test_fact',
            selectors: [
                '$.foo',
            ],
        };
        const input = {
            foo: [
                1, 2, 3,
            ],
        };

        try {
            const value = factGenerator._resolveFact(factSpecification, input);
            assert.strictEqual(input.foo, value);
            done();
        } catch (err) {
            done(err);
        }
    });

    it('throws error if selector is invalid', (done) => {
        const factGenerator = new FactGenerator();
        const factSpecification = {
            name: 'test_fact',
            selectors: [
                '$.foo!',
            ],
        };
        const input = {
            foo: [
                1, 2, 3,
            ],
        };

        try {
            factGenerator._resolveFact(factSpecification, input);
            done(new Error('expected an error'));
        } catch (err) {
            done();
        }
    });

    it('returns object with 2 selectors and expression', (done) => {
        const factGenerator = new FactGenerator();
        const factSpecification = {
            name: 'test_fact',
            selectors: [
                '$.foo[?(@.bar == 3)]',
                '$[0].baz',
            ],
            expression: "'a' + 'b' + %s",
        };
        const input = {
            foo: [{
                bar: 1,
                baz: 'a'
            }, {
                bar: 2,
                baz: 'b'
            }, {
                bar: 3,
                baz: 'c'
            },],
        };

        try {
            const value = factGenerator._resolveFact(factSpecification, input);
            assert.strictEqual('abc', value);
            done();
        } catch (err) {
            done(err);
        }
    });

    it('returns object with 1 selector and an expression with an extension',
        (done) => {
            // here we want to validate that expressions that reference extensions
            // are properly evaluated.

            class FakeExtensionManager {
                // eslint-disable-next-line class-methods-use-this
                getExtension() {
                    return {
                        invoke(list = []) {
                            const itemsThatMatchCriteria = [];
                            list.forEach(item => {
                                const matchingItem = item;
                                if (item.country === 'AF') {
                                    matchingItem.processedBy = 'fake_extension';
                                    itemsThatMatchCriteria.push(matchingItem);
                                }
                            });
                            return itemsThatMatchCriteria;
                        },
                    };
                }
            }

            const factGenerator = new FactGenerator(null, {
                extensionManager: new FakeExtensionManager(),
            });

            const factSpecification = {
                name: 'test_fact',
                selectors: [
                    '$.travel',
                ],
                expression: 'extensionManager.getExtension(\'fake_extension\')' +
                    `.invoke(${Config.factResolutionSelectionPlaceholder})` +
                    '[0].processedBy',
            };

            const input = {
                travel: [{
                    country: 'AF',
                    departureDate: '2020-08-01T15:30:14.887Z'
                },
                {
                    country: 'US',
                    departureDate: '2020-08-01T15:30:14.887Z'
                },
                ],
                foo: [{
                    bar: 1
                },
                {
                    bar: 2
                },
                ],
            };

            try {
                const value = factGenerator._resolveFact(factSpecification, input);
                // if the following assertion passes, the expression evaluation
                // successfully used factGenerator's extensionManager
                assert.strictEqual('fake_extension', value);
                done();
            } catch (err) {
                done(err);
            }
        });

    it("throws error if expression references an extension that doesn't exist",
        (done) => {
            class FakeExtensionManager {
                // eslint-disable-next-line class-methods-use-this
                getExtension(command) {
                    throw new Error(`Sorry, the extension (${command}) does not exist`);
                };
            }

            const factGenerator = new FactGenerator(null, {
                extensionManager: new FakeExtensionManager(),
            });

            const factSpecification = {
                name: 'test_fact',
                selectors: [
                    '$.travel',
                ],
                expression: 'extensionManager.getExtension(\'fake_extension\')' +
                    `.invoke(${Config.factResolutionSelectionPlaceholder})[0]` +
                    '.processedBy',
            };

            const input = {
                travel: [{
                    country: 'AF',
                    departureDate: '2020-08-01T15:30:14.887Z'
                },
                {
                    country: 'US',
                    departureDate: '2020-08-01T15:30:14.887Z'
                },
                ],
            };

            try {
                factGenerator._resolveFact(factSpecification, input);
                done(new Error('expected an error'));
            } catch (err) {
                done();
            }
        });

    it('returns fact based on another fact',
        (done) => {
            const factGenerator = new FactGenerator();
            const factSpecification = {
                name: 'test_fact',
                expression: 'foo + 1',
            };
            const input = {};

            const existingFacts = new Map();
            existingFacts.set('foo', 1);

            try {
                const value = factGenerator
                    ._resolveFact(factSpecification, input, existingFacts);
                assert.strictEqual(value, 2);
                done();
            } catch (err) {
                done(err);
            }
        });
});