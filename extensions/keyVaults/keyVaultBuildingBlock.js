exports.getBuildingBlocks = ({application, baseUri}) => {
    let _ = application.require('lodash');
    let keyVault = require('./keyVaultSettings')(application);
    return [
        {
            type: 'KeyVault',
            process: keyVault.process,
            preProcess: keyVault.preProcess,
            defaultsFilename: 'keyVaultSettings.json',
            template: _.join([baseUri, 'extensions/keyVaults/keyVaults.json'], '/'),
            deploymentName: 'kv'
        }
    ];
};
