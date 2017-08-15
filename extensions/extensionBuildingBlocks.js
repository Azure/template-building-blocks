// This is a convenience module to load all of the extension modules.  Each extension can be loaded individually.
exports.getBuildingBlocks = ({application, baseUri}) => {
    let _ = application.require('lodash');
    let extensionBuildingBlocksModules = ['./cosmosDbs/cosmosDbBuildingBlock', './keyVaults/keyVaultBuildingBlock', './templates/templateBuildingBlock'];

    let extensionBuildingBlocks = _.reduce(extensionBuildingBlocksModules, (result, value) => {
        let getBuildingBlocks = require(value).getBuildingBlocks;
        if (!getBuildingBlocks) {
            throw new Error(`'${value}' is not a valid building block module`);
        }

        result = result.concat(getBuildingBlocks({
            application: application,
            baseUri: baseUri
        }));

        return result;
    }, []);

    return extensionBuildingBlocks;
};
