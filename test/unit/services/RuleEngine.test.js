/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const assert = require('assert');
const {
    RuleEngine
} =
require('../../../services/RuleEngine');

describe('Rule Engine tests', () => {

    it('throws error when invalid rules are added', (done) => {

        const ruleEngine = new RuleEngine();
        try {
            ruleEngine.addRules([{
                foo: 'bar'
            }]);
            done('expected an error');
        } catch (err) {
            done();
        }

    });

    it('rejects when run after setting facts with a non-object', (done) => {
        const ruleEngine = new RuleEngine();
        ruleEngine.addRules([]);
        ruleEngine.setFacts(-1);
        ruleEngine.run()
            .then(() => {
                done('expected an error');
            })
            .catch(() => {
                done();
            });
    });

    it('"foo" event fires when foo === "bar"', () => {
        const ruleEngine = new RuleEngine();
        ruleEngine.addRules([{
            conditions: {
                all: [{
                    fact: 'foo',
                    operator: 'equal',
                    value: 'bar',
                }, ],
            },
            event: {
                type: 'foo',
            },
        }]);
        ruleEngine.setFacts({
            foo: 'bar'
        });
        return ruleEngine.run()
            .then((result) => {
                const {
                    events
                } = result;
                assert.ok(events);
                assert.equal(events.length, 1);
                assert.equal(events[0].type, 'foo');
            });
    });


});