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
    InputPreProcessor,
    InputPreProcessorCommands
} =
require('../../../services/InputPreProcessor');

describe('Input Pre-Processor tests', () => {

    it('naturally sorts input asc, mutating it', () => {
        const inputPreProcessor = new InputPreProcessor();
        const input = {
            foo: [{
                    bar: 2
                },
                {
                    bar: 1
                },
            ],
        };
        const sortedInput = inputPreProcessor.run(
            InputPreProcessorCommands.NaturalSort, [{
                name: 'foo',
                sort_field: 'bar',
                direction: 'asc',
            }, ],
            input);
        assert.equal(input, sortedInput);
        assert.strictEqual(sortedInput.foo[0].bar, 1);
        assert.strictEqual(sortedInput.foo[1].bar, 2);
    });

    it('naturally sorts input desc, mutating it', () => {
        const inputPreProcessor = new InputPreProcessor();
        const input = {
            foo: [{
                    bar: 1
                },
                {
                    bar: 2
                },
            ],
        };
        const sortedInput = inputPreProcessor.run(
            InputPreProcessorCommands.NaturalSort, [{
                name: 'foo',
                sort_field: 'bar',
                direction: 'desc',
            }, ],
            input);
        assert.equal(input, sortedInput);
        assert.strictEqual(sortedInput.foo[0].bar, 2);
        assert.strictEqual(sortedInput.foo[1].bar, 1);
    });

    it('throws error if invalid command is specified', (done) => {
        const inputPreProcessor = new InputPreProcessor();
        try {
            inputPreProcessor.run('fake_command', [], {});
            done(new Error('expected an error'));
        } catch (err) {
            done();
        }
    });

});