'use strict';

// We need to export a different way since we have to get the require() stuff to play nice
module.exports = (application) => {
    let _ = application.require('lodash');
    let v = application.require('./core/validation');
    let r = application.require('./core/resources');
    let az = application.require('./azCLI');

    const KEYVAULT_SETTINGS_DEFAULTS = {
        sku: {
            family: 'A',
            name: 'Standard'
        },
        accessPolicies: [
            {
                permissions: {
                    keys: [],
                    secrets: [],
                    certificates: []
                }
            }
        ],
        enabledForDeployment: false,
        enabledForDiskEncryption: false,
        enabledForTemplateDeployment: false,
        createMode: 'Default',
        tags: {}
    };

    let validSkuFamilies = ['A'];
    let validSkuNames = ['Premium', 'Standard'];
    let validCreateModes = ['Default', 'Recover']

    let isValidSkuFamily = (skuFamily) => {
        return v.utilities.isStringInArray(skuFamily, validSkuFamilies);
    };

    let isValidSkuName = (skuName) => {
        return v.utilities.isStringInArray(skuName, validSkuNames);
    };

    let isValidCreateMode = (createMode) => {
        return v.utilities.isStringInArray(createMode, validCreateModes);
    };

    let keyVaultValidations = {
        name: v.validationUtilities.isNotNullOrWhitespace,
        vaultUri: (value) => {
            if (_.isUndefined(value)) {
                return {
                    result: true
                };
            }

            return {
                result: !v.utilities.isNullOrWhitespace(value),
                message: 'Value cannot be null or only whitespace'
            };
        },
        tenantId: v.validationUtilities.isGuid,
        sku: (value) => {
            if (_.isNil(value)) {
                return {
                    result: false,
                    message: 'Value cannot be null or undefined'
                };
            }

            return {
                validations: {
                    family: (value) => {
                        return {
                            result: isValidSkuFamily(value),
                            message: `Value must be one of the following values: ${validSkuFamilies.join(',')}`
                        };
                    },
                    name: (value) => {
                        return {
                            result: isValidSkuName(value),
                            message: `Value must be one of the following values: ${validSkuNames.join(',')}`
                        };
                    }
                }
            };
        },
        accessPolicies: (value, parent) => {
            if ((_.isNil(value) || !_.isArray(value) || value.length === 0)) {
                return {
                    result: false,
                    message: 'Value must be at least a one-element array'
                };
            }

            let tenantId = parent.tenantId;
            return {
                validations: {
                    tenantId: (value) => {
                        return {
                            result: tenantId === value,
                            message: 'Value must match KeyVault tenantId'
                        };
                    },
                    objectId: v.validationUtilities.isNotNullOrWhitespace,
                    applicationId: (value) => {
                        if (_.isNil(value)) {
                            return {
                                result: true
                            };
                        }

                        return {
                            result: v.utilities.isGuid(value),
                            message: 'Value must be a valid guid'
                        };
                    },
                    permissions: {
                        keys: (value) => {
                            return {
                                result: _.isArray(value),
                                message: 'Value must be an array'
                            };
                        },
                        secrets: (value) => {
                            return {
                                result: _.isArray(value),
                                message: 'Value must be an array'
                            };
                        },
                        certificates: (value) => {
                            return {
                                result: _.isArray(value),
                                message: 'Value must be an array'
                            };
                        }
                    }
                }
            };
        },
        enabledForDeployment: v.validationUtilities.isBoolean,
        enabledForDiskEncryption: v.validationUtilities.isBoolean,
        enabledForTemplateDeployment: v.validationUtilities.isBoolean,
        enableSoftDelete: (value) => {
            if (_.isNil(value)) {
                return {
                    result: true
                };
            }

            if (!_.isBoolean(value)) {
                return {
                    result: false,
                    message: 'Value must be a boolean value'
                };
            }

            if (!value) {
                return {
                    result: false,
                    message: 'Value cannot be false'
                };
            }

            return {
                result: true
            };
        },
        createMode: (value) => {
            return {
                result: isValidCreateMode(value),
                message: `Value must be one of the following values: ${validCreateModes.join(',')}`
            };
        }
    };

    let validate = (settings) => {
        let errors = v.validate({
            settings: settings,
            validations: keyVaultValidations
        });

        return errors;
    };

    let merge = ({ settings, buildingBlockSettings, defaultSettings }) => {
        let defaults = (defaultSettings) ? [KEYVAULT_SETTINGS_DEFAULTS, defaultSettings] : KEYVAULT_SETTINGS_DEFAULTS;

        let merged = r.setupResources(settings, buildingBlockSettings, (parentKey) => {
            return (parentKey === null);
        });

        return v.merge(merged, defaults);
    };

    function transform(settings) {
        let result = {
            name: settings.name,
            tags: settings.tags,
            id: r.resourceId(settings.subscriptionId, settings.resourceGroupName, 'Microsoft.KeyVault/vaults', settings.name),
            resourceGroupName: settings.resourceGroupName,
            subscriptionId: settings.subscriptionId,
            location: settings.location,
            properties: {
                sku: settings.sku,
                tenantId: settings.tenantId,
                enabledForDeployment: settings.enabledForDeployment,
                enabledForDiskEncryption: settings.enabledForDiskEncryption,
                enabledForTemplateDeployment: settings.enabledForTemplateDeployment,
                createMode: settings.createMode,
                accessPolicies: settings.accessPolicies
            }
        };

        if (settings.enableSoftDelete) {
            result.properties.enableSoftDelete = settings.enableSoftDelete;
        }

        return result;
    }

    function process ({ settings, buildingBlockSettings, defaultSettings }) {
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

        results = _.transform(results, (result, setting) => {
            result.keyVaults.push(transform(setting));
        }, {
            keyVaults: []
        });

        // Get needed resource groups information.
        let resourceGroups = r.extractResourceGroups(results.keyVaults);
        return {
            resourceGroups: resourceGroups,
            parameters: results
        };
    }

    return {
        process: process,
        preProcess: (settings, buildingBlockSettings) => {
            // We need to look up the objectIds for the access policies to make our lives easier.
            // Remember that settings is s COPY of the actual settings so any mutations will not
            // be reflected in the calling code.  We need to return our new settings.
            settings = _.map(settings, (setting) => {
                let accessPolicies = _.transform(setting.accessPolicies, (result, value) => {
                    // Let's save the upns, delete the upns property, and use what is left as our stamp
                    let upns = value.upns;
                    if (!_.isArray(upns) || upns.length === 0) {
                        throw new Error('At least one upn must be provided for KeyVault access policies');
                    }

                    let objectIds = _.map(upns, (upn) => {
                        let child = az.spawnAz({
                            args: ['ad', 'user', 'show', '--query', 'objectId', '--upn-or-object-id', upn],
                            options: {
                                stdio: 'pipe',
                                shell: true
                            }
                        });

                        return _.trim(child.stdout.toString().trim(), '"');
                    });

                    _.forEach(objectIds, (objectId) => {
                        let accessPolicy = _.omit(value, 'upns');
                        accessPolicy.objectId = objectId;
                        result.push(accessPolicy);
                    });
                }, []);

                setting.accessPolicies = accessPolicies;
                return setting;
            });
            return settings;
        }
    };
};