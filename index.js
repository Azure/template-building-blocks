#!/usr/bin/env node
'use strict';

let commander = require('commander');
let fs = require('fs');
let path = require('path');
let _ = require('lodash');
let v = require('./core/validation');
const os = require('os');
const az = require('./azCLI');

let padInteger = (number, mask) => {
    if ((!_.isSafeInteger(number)) || (number < 0)) {
        throw new Error('number be a positive integer');
    }

    if (!_.isString(mask)) {
        throw new Error('mask must be a string');
    }
    let numberString = number.toString();
    return (mask.concat(numberString)).slice(-Math.max(mask.length, numberString.length));
};

let parseParameterFile = ({parameterFile}) => {
    // Resolve the path to be cross-platform safe
    parameterFile = path.resolve(parameterFile);
    let exists = fs.existsSync(parameterFile);
    if (!exists) {
        throw new Error(`parameters file '${parameterFile}' does not exist`);
    }

    let content = fs.readFileSync(parameterFile, 'UTF-8');

    try {
        let json = JSON.parse(content.replace(/^\uFEFF/, ''));
        let parameters = json.parameters;
        return parameters;
    } catch (e) {
        throw new Error(`parameter file '${parameterFile}' is not well-formed: ${e.message}`);
    }
};

let processParameters = ({buildingBlock, parameters, buildingBlockSettings, defaultsDirectory}) => {
    let processor = buildingBlock;

    let defaults;
    if (defaultsDirectory) {
        // Grab defaults, if they exist
        let defaultsFile = path.join(defaultsDirectory, `${processor.defaultsFilename}`);
        if (fs.existsSync(defaultsFile)) {
            try {
                let content = fs.readFileSync(defaultsFile, 'UTF-8');
                defaults = JSON.parse(content.replace(/^\uFEFF/, ''));
            } catch (e) {
                throw new Error(`error parsing '${defaultsFile}': ${e.message}`);
            }
        }
    }

    let results = processor.process({
        //settings: parameter,
        settings: parameters,
        buildingBlockSettings: buildingBlockSettings,
        defaultSettings: defaults
    });

    // Verify that any one resource group does not have multiple locations.
    // If this is the case, we can't know which one to use to create the resource group.
    // There is also a check for more than one subscription id (i.e. not the one in the building block settings).
    // If cross subscription deployments are ever implemented, remove this check.
    let groupedResourceGroups = _.map(_.uniqWith(_.map(results.resourceGroups, (value) => {
        return {
            subscriptionId: value.subscriptionId,
            resourceGroupName: value.resourceGroupName
        };
    }), _.isEqual), (value) => {
        value.locations = _.map(_.filter(results.resourceGroups, (rg) => {
            return ((rg.subscriptionId === value.subscriptionId) && (rg.resourceGroupName === value.resourceGroupName));
        }), (value) => {
            return value.location;
        });

        return value;
    });

    let invalidResourceGroups = _.filter(groupedResourceGroups, (value) => {
        return value.locations.length > 1;
    });

    if (invalidResourceGroups.length > 0) {
        let message = 'Resource groups for created resources can only be in one location';
        _.forEach(invalidResourceGroups, (value) => {
            message = message.concat(
                `${os.EOL}    subscriptionId: '${value.subscriptionId}' resourceGroup: '${value.resourceGroupName}' locations: '${value.locations.join(',')}'`);
        });
        throw new Error(message);
    }

    let invalidSubscriptions = _.filter(_.uniq(_.map(groupedResourceGroups, (value) => {
        return value.subscriptionId;
    })), (value) => {
        return value !== buildingBlockSettings.subscriptionId;
    });

    if (invalidSubscriptions.length > 0) {
        let message = 'Resource groups for created resources can only be in the deployment subscription';
        _.forEach(invalidSubscriptions, (value) => {
            message = message.concat(
                `${os.EOL}    invalid subscriptionId: '${value}'`);
        });
        throw new Error(message);
    }

    return results;
};

let getBuildingBlocks = ({baseUri, additionalBuildingBlocks = []}) => {
    // We may need to support multiple additional building blocks, so we'll squash everything together here.
    // After the command line parsing, additionalBuildingBlocks will be an array, so we'll just put the default blocks
    // first.
    let buildingBlockModules = ['./buildingBlocks'];
    if (additionalBuildingBlocks.length > 0) {
        buildingBlockModules = buildingBlockModules.concat(additionalBuildingBlocks);
    }

    // Load all of the building blocks
    let buildingBlocks = _.reduce(buildingBlockModules, (result, value) => {
        let getBuildingBlocks = require(value).getBuildingBlocks;
        if (!getBuildingBlocks) {
            throw new Error(`'${value}' is not a valid building block module`);
        }

        result = result.concat(getBuildingBlocks({
            application: module,
            baseUri: baseUri
        }));

        return result;
    }, []);

    // Validate building blocks.
    // Make sure type and defaultsFilename aren't duplicated
    let duplicates = _.transform(_.groupBy(buildingBlocks, (value) => {
        return value.type;
    }), (result, value, key) => {
        if (value.length > 1) {
            result.push(key);
        }

        return result;
    }, []);

    if (duplicates.length > 0) {
        throw new Error(`Duplicate building block types found: ${duplicates.join(',')}`);
    }

    duplicates = _.transform(_.groupBy(buildingBlocks, (value) => {
        return value.defaultsFilename;
    }), (result, value, key) => {
        if (value.length > 1) {
            result.push(key);
        }

        return result;
    }, []);

    if (duplicates.length > 0) {
        throw new Error(`Duplicate building block default filenames found: ${duplicates.join(',')}`);
    }

    return buildingBlocks;
};

let createTemplateParameters = ({parameters}) => {
    let templateParameters = {
        $schema: 'http://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#',
        contentVersion: '1.0.0.0',
        parameters: _.transform(parameters, (result, value, key) => {
            // All KeyVault parameters are named secret.  We need to see if it's a value, or if it is a KeyVault reference.
            if (key === 'secret') {
                if (_.isUndefined(value.reference)) {
                    result[key] = {
                        value: value
                    };
                } else {
                    result[key] = value;
                }
            } else {
                result[key] = {
                    value: value
                };
            }

            return result;
        }, {})
    };

    return templateParameters;
};

let validateSubscriptionId = (value) => {
    if (!v.utilities.isGuid(value)) {
        throw new Error(`invalid subscription-id '${value}'`);
    }

    return value;
};

let validOutputFormats = ['json', 'files'];

let isValidOutputFormat = (value) => {
    return v.utilities.isStringInArray(value, validOutputFormats);
};

let createResourceGroups = ({resourceGroups}) => {
    // We need to group them in an efficient way for the CLI
    resourceGroups = _.groupBy(resourceGroups, (value) => {
        return value.subscriptionId;
    });

    _.forOwn(resourceGroups, (value, key) => {
        // Set the subscription for the tooling so we can create the resource groups in the right subscription
        az.setSubscription({
            subscriptionId: key
        });
        _.forEach(value, (value) => {
            az.createResourceGroupIfNotExists({
                resourceGroupName: value.resourceGroupName,
                location: value.location
            });
        });
    });
};

let deployTemplate = ({processedBuildingBlock}) => {
    // Get the current date in UTC and remove the separators.  We can use this as our deployment name.

    az.setSubscription({
        subscriptionId: processedBuildingBlock.buildingBlockSettings.subscriptionId
    });

    az.createResourceGroupIfNotExists({
        location: processedBuildingBlock.buildingBlockSettings.location,
        resourceGroupName: processedBuildingBlock.buildingBlockSettings.resourceGroupName,
    });

    // In case we have a SAS token, we need to append it to the template uri.  It will be passed into the building block in
    // the buildingBlockSettings objects as well.
    let templateUri = processedBuildingBlock.buildingBlock.template.concat(processedBuildingBlock.buildingBlockSettings.sasToken);
    az.deployTemplate({
        deploymentName: processedBuildingBlock.deploymentName,
        resourceGroupName: processedBuildingBlock.buildingBlockSettings.resourceGroupName,
        templateUri: templateUri,
        parameterFile: processedBuildingBlock.outputFilename
    });
};

let defaultOptions = {
    cloudName: 'AzureCloud',
    outputFormat: 'files',
    deploy: false,
    templateBaseUri: 'https://raw.githubusercontent.com/mspnp/template-building-blocks/roshar/spikes/spikes/nodejs-spike/templates'
};

let getCloud = ({name}) => {
    let registeredClouds = az.getRegisteredClouds();

    let cloud = _.find(registeredClouds, (value) => {
        return value.name === name;
    });

    if (_.isUndefined(cloud)) {
        throw new Error(`cloud '${name}' not found`);
    }

    return cloud;
};

let validateCommandLine = ({commander}) => {
    let options = _.cloneDeep(defaultOptions);

    if (_.isUndefined(commander.parametersFile)) {
        throw new Error('no parameters file specified');
    } else {
        let parametersFile = path.resolve(commander.parametersFile);
        if (!fs.existsSync(parametersFile)) {
            throw new Error(`parameters file '${parametersFile}' does not exist`);
        }

        options.parametersFile = parametersFile;
    }

    // The base uri can't end in / for blob storage, so we'll clean both here, just in case
    options.templateBaseUri = _.trimEnd(_.isUndefined(commander.templateBaseUri) ? options.templateBaseUri : commander.templateBaseUri, '/');

    if (!_.isUndefined(commander.outputFormat)) {
        options.outputFormat = commander.outputFormat;
    }

    if (commander.deploy === true) {
        options.deploy = true;
    }

    if (!_.isUndefined(commander.subscriptionId)) {
        options.subscriptionId = commander.subscriptionId;
    }

    if (!_.isUndefined(commander.resourceGroup)) {
        options.resourceGroup = commander.resourceGroup;
    }

    if (!_.isUndefined(commander.location)) {
        options.location = commander.location;
    }

    options.sasToken = _.isUndefined(commander.sasToken) ? '' : '?'.concat(commander.sasToken);

    options.cloud = getCloud({
        name: _.isUndefined(commander.cloud) ? options.cloudName : commander.cloud
    });

    if (!_.isUndefined(commander.buildingBlocks)) {
        // This can be a semicolon separated set of files, we we need to resolve them all
        let additionalBuildingBlocks = _.map(commander.buildingBlocks.split(';'), (value) => {
            return path.resolve(value);
        });
        options.additionalBuildingBlocks = additionalBuildingBlocks;
    }

    if (!_.isUndefined(commander.defaultsDirectory)) {
        let defaultsDirectory = path.resolve(commander.defaultsDirectory);
        if (!fs.existsSync(defaultsDirectory)) {
            throw new Error(`defaults path '${defaultsDirectory}' was not found`);
        }

        options.defaultsDirectory = defaultsDirectory;
    }

    // Calculate "defaults"
    let outputFile = _.isUndefined(commander.outputFile) ? commander.parametersFile : path.resolve(commander.outputFile);
    options.outputBaseFilename = `${path.basename(outputFile, path.extname(outputFile))}-output`;
    options.outputDirectory = _.isUndefined(commander.outputFile) ? process.cwd() : path.dirname(outputFile);

    // Validate values
    if (!isValidOutputFormat(options.outputFormat)) {
        throw new Error(`output must be one of the following values: ${validOutputFormats.join(',')}`);
    }

    // Validate combinations
    if (options.outputFormat === 'json') {
        if (options.deploy === true) {
            throw new Error('--deploy cannot be used with the json output format');
        }

        // To make the interface easier, let's default a few things rather than making them explicit.
        // 1.  If neither json or outputFile is specified, assume output file is the intent, and default
        //     the outputFilename to be based on the parameter filename
        // 2.  If json is specified, no output filename is required. (We will still calculate a default, but we won't use it)
        // 3.  If outputFile is specified, we use that filename as the basis for our output filename
        // 4.  If both are specified, we'll just throw
        if (!_.isUndefined(commander.outputFile)) {
            throw new Error('json output format cannot be used with --output-file');
        }
    }

    return options;
};

let generateDefaultBuildingBlockSettings = ({options, parameters}) => {
    if (!_.has(parameters, 'buildingBlocks.value')) {
        throw new Error('parameters.buildingBlocks.value was not found');
    }

    // We need to validate that the subscriptionId, resourceGroupName, and location are not set as parameters if they have
    // already been specified on the command line
    if (((_.isUndefined(options.subscriptionId)) && (!_.has(parameters, 'subscriptionId.value'))) ||
        ((!_.isUndefined(options.subscriptionId)) && (_.has(parameters, 'subscriptionId.value')))) {
        throw new Error('subscriptionId was must be specified on the command line or must be set as a parameter, but not both');
    }

    if (((_.isUndefined(options.resourceGroup)) && (!_.has(parameters, 'resourceGroupName.value'))) ||
        ((!_.isUndefined(options.resourceGroup)) && (_.has(parameters, 'resourceGroupName.value')))) {
        throw new Error('resourceGroupName was must be specified on the command line or must be set as a parameter, but not both');
    }

    if (((_.isUndefined(options.location)) && (!_.has(parameters, 'location.value'))) ||
        ((!_.isUndefined(options.location)) && (_.has(parameters, 'location.value')))) {
        throw new Error('location was must be specified on the command line or must be set as a parameter, but not both');
    }

    return {
        subscriptionId: options.subscriptionId ? options.subscriptionId : parameters.subscriptionId.value,
        resourceGroupName: options.resourceGroup ? options.resourceGroup : parameters.resourceGroupName.value,
        location: options.location ? options.location : parameters.location.value,
        cloud: options.cloud,
        sasToken: options.sasToken
    };
};

try {
    commander
        .version('0.0.1')
        .option('-g, --resource-group <resource-group>', 'the name of the resource group')
        .option('-p, --parameters-file <parameters-file>', 'the path to a parameters file')
        .option('-o, --output-file <output-file>', 'the output file name')
        .option('-s, --subscription-id <subscription-id>', 'the subscription identifier', validateSubscriptionId)
        .option('-l, --location <location>', 'location in which to create the resource group, if it does not exist')
        .option('-d, --defaults-directory <defaults-directory>', 'directory containing customized building block default values')
        .option('--deploy', 'deploy building block using az')
        .option('-t, --template-base-uri <template-base-uri>', 'base uri of building block templates')
        .option('-k, --sas-token <sas-token>', 'sas token to pass to the template-base-uri')
        .option('-c, --cloud, <cloud>', 'registered az cloud to use')
        .option('-f, --output-format <output-format>', `Output format.  Allowed values: ${validOutputFormats.join(', ')}`)
        .option('-b, --building-blocks <building-blocks>', 'additional building blocks to add to the pipeline')
        .parse(process.argv);

    let options = validateCommandLine({
        commander: commander
    });

    let buildingBlocks = getBuildingBlocks({
        baseUri: options.templateBaseUri,
        additionalBuildingBlocks: options.additionalBuildingBlocks
    });

    let parameters = parseParameterFile({
        parameterFile: options.parametersFile
    });

    let defaultBuildingBlockSettings = generateDefaultBuildingBlockSettings({
        options: options,
        parameters: parameters
    });

    let buildingBlockParameters = _.castArray(parameters.buildingBlocks.value);

    if (buildingBlockParameters.length === 0) {
        throw new Error('no building blocks specified');
    }

    let results = _.map(buildingBlockParameters, (value, index) => {
        let buildingBlockType = value.type;
        let buildingBlock = _.find(buildingBlocks, (value) => {
            return value.type === buildingBlockType;
        });

        if (!buildingBlock) {
            throw new Error(`building block for parameter '${buildingBlockType}' was not found.`);
        }

        // Build the local buildingBlockSettings
        let buildingBlockSettings = {
            subscriptionId: value.subscriptionId ? value.subscriptionId : defaultBuildingBlockSettings.subscriptionId,
            resourceGroupName: value.resourceGroupName ? value.resourceGroupName : defaultBuildingBlockSettings.resourceGroupName,
            location: value.location ? value.location : defaultBuildingBlockSettings.location,
            cloud: defaultBuildingBlockSettings.cloud,
            sasToken: defaultBuildingBlockSettings.sasToken
        };

        let result = processParameters({
            buildingBlock: buildingBlock,
            parameters: value.settings,
            buildingBlockSettings: buildingBlockSettings,
            defaultsDirectory: options.defaultsDirectory
        });

        // Generate deployment name to use in parameters and deployment
        let deploymentName = `bb-${padInteger(index + 1, '00')}-${buildingBlock.deploymentName}`;
        // We need to add the deploymentContext to the template parameter files.
        result.parameters.deploymentContext = {
            parentTemplateUniqueString: deploymentName,
            sasToken: buildingBlockSettings.sasToken
        };

        let templateParameters = createTemplateParameters({
            parameters: result.parameters
        });

        // Attach everything to our result so we can access it later as a unit.
        result.deploymentName = deploymentName;
        result.templateParameters = templateParameters;
        result.buildingBlock = buildingBlock;
        result.buildingBlockSettings = buildingBlockSettings;

        // Add the output filename
        result.outputFilename = path.format({
            dir: options.outputDirectory,
            name: `${options.outputBaseFilename}-${padInteger(index + 1, '00')}`,
            ext: '.json'
        });
        return result;
    });

    // Add the output filenames even if they aren't needed.
    if (results.length === 1) {
        results[0].outputFilename = path.format({
            dir: options.outputDirectory,
            name: options.outputBaseFilename,
            ext: '.json'
        });
    }

    // Output the parameters based on flags
    if (options.outputFormat === 'json') {
        let templateParameters = _.map(results, (value) => {
            return value.templateParameters;
        });

        let output = JSON.stringify((templateParameters.length === 1) ? templateParameters[0] : templateParameters, null, 2);
        console.log(output);
    } else if (options.outputFormat === 'files') {
        _.forEach(results, (value) => {
            let output = JSON.stringify(value.templateParameters, null, 2);
            fs.writeFileSync(value.outputFilename, output);
            console.log();
            console.log(`  parameters written to ${value.outputFilename}`);
            console.log();
        });
    }

    if (options.deploy) {
        // We need to set the active cloud.  Currently we do not support deployments across clouds.
        az.setCloud({
            name: options.cloudName
        });
        _.forEach(results, (value) => {
            // Get the resources groups to create if they don't exist.  Each block is responsible for specifying these.
            createResourceGroups({
                resourceGroups: value.resourceGroups
            });
            if (value.preDeployment) {
                value.preDeployment(value.preDeploymentParameter);
            }
            deployTemplate({
                processedBuildingBlock: value
            });
            if (value.postDeployment) {
                value.postDeployment(value.postDeploymentParameter);
            }
        });
    }
} catch (e) {
    console.error();
    console.error(`  error: ${e.message}`);
    console.error();
    process.exit(1);
}
