exports.getBuildingBlocks = ({application, baseUri}) => {
    let _ = application.require('lodash');
    return [
        {
            type: 'CosmosDb',
            process: require('./cosmosDbSettings')(application).process,
            defaultsFilename: 'cosmosDbSettings.json',
            template: _.join([baseUri, 'extensions/cosmosDbs/cosmosDbs.json'], '/'),
            deploymentName: 'cdb'
        }
    ];
};