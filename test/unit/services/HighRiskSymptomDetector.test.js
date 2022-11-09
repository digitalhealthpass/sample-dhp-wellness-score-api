/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

/* eslint-disable indent */
const {
    assert
} = require('chai');
const {
    HighRiskSymptomDetector
} =
require('../../../services/HighRiskSymptomDetector');

describe('High Risk Symptom Detector tests', () => {

    it('resolves empty list when no symptoms are provided', () => {
        const highRiskSymptomDetector = new HighRiskSymptomDetector();
        const results = highRiskSymptomDetector.invoke([]);

        assert.ok(results);
        assert.equal(0, results.length);

    });

    it('detects high-risk combination on 2020-08-11', () => {
        const highRiskSymptomCombinations = [
            ['a', 'b', 'c'],
            ['d', 'e', 'f'],
        ];

        const highRiskSymptomDetector = new HighRiskSymptomDetector(null, {
            highRiskSymptomCombinations,
        });
        const results = highRiskSymptomDetector.invoke([{
                type: {
                    name: 'a'
                },
                date: '2020-08-11T12:33:11.12Z',
            },
            {
                type: {
                    name: 'b'
                },
                date: '2020-08-11T12:33:11.12Z',
            },
            {
                type: {
                    name: 'c'
                },
                date: '2020-08-11T12:33:11.12Z',
            },
            {
                type: {
                    name: 'd'
                },
                date: '2020-08-10T12:33:11.12Z',
            },
            {
                type: {
                    name: 'e'
                },
                date: '2020-08-10T12:33:11.12Z',
            },
        ]);

        assert.ok(results);
        assert.equal(1, results.length);
        assert.equal(results[0].date, '2020-08-11T23:59:59.999Z');
    });

    it('resolves empty list when no high-risk symptom combinations are detected',
        () => {
            const highRiskSymptomCombinations = [
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
            ];

            const highRiskSymptomDetector = new HighRiskSymptomDetector(null, {
                highRiskSymptomCombinations,
            });
            const results = highRiskSymptomDetector.invoke([{
                    type: {
                        name: 'b'
                    },
                    date: '2020-08-11T12:33:11.12Z',
                },
                {
                    type: {
                        name: 'c'
                    },
                    date: '2020-08-11T12:33:11.12Z',
                },
                {
                    type: {
                        name: 'd'
                    },
                    date: '2020-08-10T12:33:11.12Z',
                },
                {
                    type: {
                        name: 'e'
                    },
                    date: '2020-08-10T12:33:11.12Z',
                },
            ]);
            assert.ok(results);
            assert.equal(0, results.length);

        });

    it('rejects when date is not specified', (done) => {
        const highRiskSymptomDetector = new HighRiskSymptomDetector();
        try {
            highRiskSymptomDetector.invoke([{
                type: {
                    name: 'b'
                },
            }, ]);
            done(new Error('expected an error'));
        } catch (err) {
            done();
        }
    });
});