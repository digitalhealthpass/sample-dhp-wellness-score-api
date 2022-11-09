/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const {
    Logger
} = require('dhp-logging-lib');
const uuid = require('uuid');
const _ = require('lodash');

const SupportedCommands = {
    NaturalSort: 'natural_sort',
};

const DEFAULT_OPTIONS = {
    functionMap: undefined,
};

/**
 * @param {[#/components/schemas/PreProcessingTarget]} targets
 * @param {object} input the data to be naturally sorted; the input will
 * be mutated
 * @returns {object} the sorted input
 */
function naturalSort(targets, input) {
    this.logger.info('Attempting to apply natural sort to input');
    if (!targets || targets.length === 0) {
        this.logger.warn('Nothing to sort, returning original input');
        return input;
    }
    if (!input) {
        const message = "Can't sort invalid input";
        this.logger.error(message);
        const error = new Error(message);
        error.status = 400;
        throw error;
    }

    const sortedInput = input;
    targets.forEach(target => {
        const {
            name,
            direction
        } = target;
        const sortField = target.sort_field;

        this.logger.info(`Sorting $.${name} by ${sortField} (${direction})`);

        sortedInput[name] = _.sortBy(input[name], (element) => {
            return element[sortField];
        });
        if (direction === 'desc') {
            this.logger.info(`Reversing $.${name}`);
            sortedInput[name] = _.reverse(input[name]);
        }
    });
    this.logger.info('Sort completed');
    return sortedInput;
}

class InputPreProcessor {

    constructor(logger, options = {}) {
        const name = 'InputPreProcessor';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.options = {};
        this.options = Object.assign(this.options, DEFAULT_OPTIONS);
        this.options = Object.assign(this.options, options);

        if (this.options.functionMap) {
            this.functionMap = this.options.functionMap;
        } else {
            this.functionMap = {};
            this.functionMap[SupportedCommands.NaturalSort] = naturalSort;
        }
    }

    /**
     *
     * @param {string} command
     * @param {[#/components/schemas/NaturalSortPreProcessingTarget]} targets
     * the attributes of the input to be pre-processed
     * @param {object} input the data to be pre-processed; the
     * input will be mutated
     * @returns {object} the pre-processed input
     */
    run(command, targets, input) {
        this.logger.info(`Pre-processing input: ${command}`);
        const func = this.functionMap[command];
        if (func) {
            const preProcessedInput = func.call(this, targets, input);
            this.logger.info('Pre-processing completed');
            return preProcessedInput;
        }
        const error = new Error(`Command "${command}" is not supported`);
        error.status = 400;
        throw error;
    }
}

module.exports.InputPreProcessor = InputPreProcessor;
module.exports.InputPreProcessorCommands = SupportedCommands;