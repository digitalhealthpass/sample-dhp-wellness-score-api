/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

module.exports = {
    enableSchemaCaching: process.env.ENABLE_SCHEMA_CACHING ?
        process.env.ENABLE_SCHEMA_CACHING === 'true' : true,
    schemaCacheSize: process.env.SCHEMA_CACHE_SIZE || 100,
    schemaEvictionAlgorithm: process.env.SCHEMA_CACHE_EVICTION_ALGORITHM ||
        'lru', // lru, mru, lfu, or mfu
    schemaValidationType: process.env.SCHEMA_VALIDATION_TYPE ||
        'full', // full, fast
    factResolutionSelectionPlaceholder: process.env.FACT_RESOLUTION_SELECTION_PLACEHOLDER || '%s',
};