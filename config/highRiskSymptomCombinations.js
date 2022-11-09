/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const Symptoms = {
    cough: 'cough',
    chills: 'chills',
    fever: 'fever',
    shortness_of_breath: 'shortness of breath',
    difficulty_breathing: 'difficulty breathing',
};

const Combinations = [
    [Symptoms.cough, Symptoms.chills, Symptoms.fever, Symptoms.shortness_of_breath],
    [Symptoms.cough, Symptoms.chills, Symptoms.fever, Symptoms.difficulty_breathing],
];

module.exports = Combinations;