'use strict';

// We need to export a different way since we have to get the require() stuff to play nice
module.exports = (application) => {
    let _ = application.require('lodash');
    let v = application.require('./core/validation');
    let r = application.require('./core/resources');
    let az = application.require('./azCLI');
    let chalk = require('chalk');
    console.log(chalk.blue('Hello, World!'));

    const COSMOSDB_SETTINGS_DEFAULTS = {
        kind: 'DocumentDB',
        databaseAccountOfferType: 'Standard',
        consistencyPolicy: {
            defaultConsistencyLevel: 'Session',
            maxStalenessPrefix: 100,
            maxIntervalInSeconds: 5
        },
        enableAutomaticFailover: false,
        databases: [
            {
                collections: []
            }
        ],
        locations: [],
        tags: {}
    };

    // This default is different than any of the others.  We need to do different defaults based on partition path
    let calculateThroughputDefault = (throughput, isPartitioned) => {
        // If throughput is specified, just return it.
        // If we are partitioned, our default is 2500.
        // If not, our default is 400.
        if (throughput) {
            return throughput;
        } else if (isPartitioned) {
            return 2500;
        } else {
            return 400;
        }
    };

    // These are the "kinds" of CosmosDBs that the building block supports.  However, the way they are used is slightly odd, so we'll handle it using a lookup.
    let validKinds = ['DocumentDB', 'Graph', 'MongoDB', 'Table'];
    let validDatabaseAccountOfferTypes = ['Standard'];
    let validConsistencyLevels = ['BoundedStaleness', 'ConsistentPrefix', 'Eventual', 'Session', 'Strong'];
    let validDefaultTtls = ['Default'];

    let isValidKind = (kind) => {
        return v.utilities.isStringInArray(kind, validKinds);
    };

    let isValidDatabaseAccountOfferType = (databaseAccountOfferType) => {
        return v.utilities.isStringInArray(databaseAccountOfferType, validDatabaseAccountOfferTypes);
    };

    let isValidConsistencyLevel = (consistencyLevel) => {
        return v.utilities.isStringInArray(consistencyLevel, validConsistencyLevels);
    };

    let isValidDefaultTtl = (defaultTtl) => {
        return v.utilities.isStringInArray(defaultTtl, validDefaultTtls);
    };

    let kindsMapping = {
        DocumentDB: 'GlobalDocumentDB',
        Graph: 'GlobalDocumentDB',
        MongoDB: 'MongoDB',
        Table: 'GlobalDocumentDB'
    };

    let collectionValidations = {
        name: v.validationUtilities.isNotNullOrWhitespace,
        defaultTtl: (value) => {
            if (_.isUndefined(value)) {
                return {
                    result: true
                };
            } else {
                return {
                    result: isValidDefaultTtl(value) || (_.isSafeInteger(value) && value > 0),
                    message: `defaultTtl must be a positive integer or one of the following values: ${validDefaultTtls.join(',')}`
                };
            }
        },
        partitionKeyPath: (value) => {
            if (_.isUndefined) {
                return {
                    result: true
                };
            }

            return {
                result: v.utilities.isNullOrWhitespace(value),
                message: 'Value cannot be null, empty, or only whitespace'
            };
        },
        throughput: (value, parent) => {
            if (_.isNil(value)) {
                return {
                    result: false,
                    message: 'Value cannot be undefined or null'
                };
            }

            // Must be in multiples of 100
            if ((value % 100) !== 0) {
                return {
                    result: false,
                    message: 'Value must be in multiples of 100'
                };
            }

            if (_.isUndefined(parent.partitionKeyPath)) {
                return {
                    result: _.inRange(value, 400, 10001),
                    message: 'Value must be between 400 and 10000'
                };
            } else {
                return {
                    result: _.inRange(value, 2500, 100001),
                    message: 'Value must be between 2500 and 100000'
                };
            }
        }
    };

    let databaseValidations = {
        name: v.validationUtilities.isNotNullOrWhitespace,
        collections: (value) => {
            if (_.isNil(value)) {
                return {
                    result: false,
                    message: 'Value cannot be null or undefined'
                };
            }

            if (!_.isArray) {
                return {
                    result: false,
                    message: 'Value must be an array'
                };
            }

            return {
                validations: collectionValidations
            };
        }
    };

    let cosmosDbValidations = {
        name: v.validationUtilities.isNotNullOrWhitespace,
        kind: (value) => {
            return {
                result: isValidKind(value),
                message: `Value must be one of the following values: ${validKinds.join(',')}`
            };
        },
        databaseAccountOfferType: (value) => {
            return {
                result: isValidDatabaseAccountOfferType(value),
                message: `Value must be one of the following values: ${validDatabaseAccountOfferTypes.join(',')}`
            };
        },
        consistencyPolicy: () => {
            return {
                validations: {
                    defaultConsistencyLevel: (value) => {
                        return {
                            result: isValidConsistencyLevel(value),
                            message: `Value must be one of the following values: ${validConsistencyLevels.join(',')}`
                        };
                    },
                    maxStalenessPrefix: (value, parent) => {
                        if (parent.defaultConsistencyLevel !== 'BoundedStaleness') {
                            return {
                                result: true
                            };
                        }

                        return {
                            result: _.inRange(1, 2147483648),
                            message: 'Value must be in the range of 1-2,147,483,647'
                        };
                    },
                    maxIntervalInSeconds: (value, parent) => {
                        if (parent.defaultConsistencyLevel !== 'BoundedStaleness') {
                            return {
                                result: true
                            };
                        }

                        return {
                            result: _.inRange(1, 101),
                            message: 'Value must be in the range of 1-100'
                        };
                    }
                }
            };
        },
        locations: (value) => {
            if (!_.isArray(value)) {
                return {
                    result: false,
                    message: 'Value must be an array'
                };
            }

            return {
                validations: v.validationUtilities.isNotNullOrWhitespace
            };
        },
        enableAutomaticFailover: v.validationUtilities.isBoolean,
        ipRangeFilter: (value) => {
            if (_.isUndefined(value)) {
                return {
                    result: true
                };
            }
            if (v.utilities.isNullOrWhitespace(value)) {
                return {
                    result: false,
                    message: 'Value cannot be null, empty, or only whitespace'
                };
            }

            // This should be a comma-separated list of IP addresses and/or CIDRs.  We'll be forgiving on whitespace
            let filters = _.map(value.split(','), (value) => {
                return value.trim();
            });

            // Validate that each value is an IP Address or CIDR
            let invalidFilters = _.filter(filters, (value) => {
                return !v.utilities.networking.isValidIpAddress(value) && !v.utilities.networking.isValidCidr(value);
            });

            if (invalidFilters.length > 0) {
                return {
                    result: false,
                    message: `Value must be a comma-separated list of IP addresses or IP address ranges in CIDR format.  Invalid filters: ${invalidFilters.join(',')}`
                };
            }

            return {
                result: true
            };
        },
        databases: (value) => {
            if (_.isNil(value)) {
                return {
                    result: false,
                    message: 'Value cannot be null or undefined'
                };
            }

            if (!_.isArray) {
                return {
                    result: false,
                    message: 'Value must be an array'
                };
            }

            return {
                validations: databaseValidations
            };
        }
    };

    let validate = (settings) => {
        let errors = v.validate({
            settings: settings,
            validations: cosmosDbValidations
        });

        return errors;
    };

    let merge = ({ settings, buildingBlockSettings, defaultSettings }) => {
        let defaults = (defaultSettings) ? [COSMOSDB_SETTINGS_DEFAULTS, defaultSettings] : COSMOSDB_SETTINGS_DEFAULTS;

        let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
            return ((parentKey === null) || (parentKey === 'databases'));
        });

        return v.merge(merged, defaults, (objValue, srcValue, key, object, source) => {
            // This works because the defaultConsistencyLevel is Session and locations is [].  If these ever change,
            // this needs to be revisited.
            if ((key === 'consistencyPolicy') && (srcValue.defaultConsistencyLevel === 'BoundedStaleness')) {
                // Do we have multiple locations?
                let hasMultipleLocations = _.isArray(source.locations) && source.locations.length > 1;
                let consistencyPolicy = {
                    defaultConsistencyLevel: srcValue.defaultConsistencyLevel,
                    maxStalenessPrefix: hasMultipleLocations ? 100000 : objValue.maxStalenessPrefix,
                    maxIntervalInSeconds: hasMultipleLocations ? 300 : objValue.maxIntervalInSeconds
                };

                // If the user provided either of the values, just use them.
                if (srcValue.maxStalenessPrefix) {
                    consistencyPolicy.maxStalenessPrefix = srcValue.maxStalenessPrefix;
                }

                if (srcValue.maxIntervalInSeconds) {
                    consistencyPolicy.maxIntervalInSeconds = srcValue.maxIntervalInSeconds;
                }

                return consistencyPolicy;
            }

            if (key === 'collections') {
                return _.map(srcValue, (value) => {
                    let result = {
                        name: value.name,
                        throughput: calculateThroughputDefault(value.throughput, !_.isUndefined(value.partitionKeyPath))
                    };

                    if (value.partitionKeyPath) {
                        result.partitionKeyPath = value.partitionKeyPath;
                    }

                    if (value.defaultTtl) {
                        result.defaultTtl = value.defaultTtl;
                    }

                    return result;
                });
            }
        });
    };

    function transform(settings) {
        let result = {
            name: settings.name,
            tags: settings.tags,
            id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.DocumentDB/databaseAccounts', settings.name),
            resourceGroupName: settings.resourceGroupName,
            subscriptionId: settings.subscriptionId,
            location: settings.location,
            kind: kindsMapping[settings.kind],
            properties: {
                name: settings.name,
                databaseAccountOfferType: settings.databaseAccountOfferType,
                consistencyPolicy: {
                    defaultConsistencyLevel: settings.consistencyPolicy.defaultConsistencyLevel
                }
            }
        };

        // Because of how CosmosDB handles the different kinds of databases, we have to do a little more work here.
        if (settings.kind !== 'MongoDB') {
            result.tags.defaultExperience = settings.kind;
        }

        if (settings.consistencyPolicy.defaultConsistencyLevel === 'BoundedStaleness') {
            result.properties.consistencyPolicy.maxStalenessPrefix = settings.consistencyPolicy.maxStalenessPrefix;
            result.properties.consistencyPolicy.maxIntervalInSeconds = settings.consistencyPolicy.maxIntervalInSeconds;
        }

        if (settings.locations.length > 0) {
            result.properties.locations = _.map(settings.locations, (value, index) => {
                return {
                    locationName: value,
                    failoverPriority: index
                };
            });
        }

        if (settings.ipRangeFilter) {
            // Make sure we don't have any extra whitespace
            result.properties.ipRangeFilter = (_.map(settings.ipRangeFilter.split(','), (value) => {
                return value.trim();
            })).join(',');
        }

        if (settings.enableAutomaticFailover) {
            result.properties.enableAutomaticFailover = settings.enableAutomaticFailover;
        }

        return result;
    }

    function process({ settings, buildingBlockSettings, defaultSettings }) {
        settings = _.castArray(settings);

        let buildingBlockErrors = v.validate({
            settings: buildingBlockSettings,
            validations: {
                subscriptionId: v.validationUtilities.isGuid,
                resourceGroupName: v.validationUtilities.isNotNullOrWhitespace,
            }
        });

        if (buildingBlockErrors.length > 0) {
            throw new Error(JSON.stringify(buildingBlockErrors));
        }

        let results = merge({
            settings: settings,
            buildingBlockSettings: buildingBlockSettings,
            defaultSettings: defaultSettings
        });

        let errors = validate(results);

        if (errors.length > 0) {
            throw new Error(JSON.stringify(errors));
        }

        // These should contain all of the information that would be needed for any commands supported by this block.  It can be in any shape
        // that is required, as it will just be passed along to the callback.

        // We can use preDeployment to check if our names exist
        let preDeploymentParameter = {
            cosmosDbNames: []
        };

        let postDeploymentParameter = {
            cosmosDbs: []
        };

        results = _.transform(results, (result, setting) => {
            result.cosmosDbs.push(transform(setting));
            preDeploymentParameter.cosmosDbNames.push(setting.name);
            postDeploymentParameter.cosmosDbs.push({
                name: setting.name,
                resourceGroupName: setting.resourceGroupName,
                subscriptionId: setting.subscriptionId,
                databases: setting.databases
            });
        }, {
            cosmosDbs: []
        });

        // Get needed resource groups information.
        let resourceGroups = r.extractResourceGroups(results.cosmosDbs);
        return {
            resourceGroups: resourceGroups,
            parameters: results,
            preDeploymentParameter: preDeploymentParameter,
            preDeployment: ({cosmosDbNames}) => {
                // Subscription doesn't matter here so there is no need to set it.
                // We will check all names here and throw one exception that contains all of the invalid names.
                let existingCosmosDbNames = _.filter(cosmosDbNames, (value) => {
                    let child = az.spawnAz({
                        args: ['cosmosdb', 'check-name-exists', '--name', value],
                        options: {
                            stdio: 'pipe',
                            shell: true
                        }
                    });

                    // The result has to be trimmed because it has a newline at the end
                    return (child.stdout.toString().trim() === 'true');
                });

                if (existingCosmosDbNames.length > 0) {
                    throw new Error(`One or more CosmosDb names already exist: ${existingCosmosDbNames.join(',')}`);
                }
            },
            postDeploymentParameter: postDeploymentParameter,
            postDeployment: ({ cosmosDbs }) => {
                _.forEach(cosmosDbs, (value) => {
                    // Set the subscription since we don't know which subscription we may be in for this resource
                    az.setSubscription({
                        subscriptionId: value.subscriptionId
                    });
                    _.forEach(value.databases, (database) => {
                        az.spawnAz({
                            args: ['cosmosdb', 'database', 'create', '--name', value.name,
                                '--resource-group', value.resourceGroupName,
                                '--db-name', database.name],
                            options: {
                                stdio: 'inherit',
                                shell: true
                            }
                        });
                        _.forEach(database.collections, (collection) => {
                            let args = ['cosmosdb', 'collection', 'create', '--name', value.name,
                                '--resource-group', value.resourceGroupName,
                                '--db-name', database.name,
                                '--collection-name', collection.name,
                                '--throughput', collection.throughput];
                            if (collection.partitionKeyPath) {
                                args = args.concat(['--partition-key-path', collection.partitionKeyPath]);
                            }

                            if (collection.defaultTtl) {
                                args = args.concat(['--default-ttl', collection.defaultTtl === 'Default' ? -1 : collection.defaultTtl]);
                            }

                            az.spawnAz({
                                args: args,
                                options: {
                                    stdio: 'inherit',
                                    shell: true
                                }
                            });
                        });
                    });
                });
            }
        };
    }

    return {
        process: process
    };
};