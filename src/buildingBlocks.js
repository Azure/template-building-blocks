// We are making this look a bit different to be more in-line with building block "extension" modules.
// Since we are in the application itself, we could ignore the application parameter because the default
// module resolution will work for us.  However, to be more illustrative, we will call application like
// external building blocks would have to do.
exports.getBuildingBlocks = ({application, baseUri}) => {
    let _ = require('lodash');
    return [
        {
            //type: 'VirtualMachine',
            type: 'VirtualMachine',
            process: application.require('./core/virtualMachineSettings').process,
            defaultsFilename: 'virtualMachineSettings.json',
            template: _.join([baseUri, 'buildingBlocks/virtualMachines/virtualMachines.json'], '/'),
            deploymentName: 'vm'
        },
        {
            type: 'NetworkSecurityGroup',
            process: application.require('./core/networkSecurityGroupSettings').process,
            defaultsFilename: 'networkSecurityGroupSettings.json',
            template: _.join([baseUri, 'buildingBlocks/networkSecurityGroups/networkSecurityGroups.json'], '/'),
            deploymentName: 'nsg'
        },
        {
            type: 'RouteTable',
            process: application.require('./core/routeTableSettings').process,
            defaultsFilename: 'routeTableSettings.json',
            template: _.join([baseUri, 'buildingBlocks/routeTables/routeTables.json'], '/'),
            deploymentName: 'rt'
        },
        {
            type: 'VirtualMachineExtension',
            process: application.require('./core/virtualMachineExtensionsSettings').process,
            defaultsFilename: 'virtualMachinesExtensionSettings.json',
            template: _.join([baseUri, 'buildingBlocks/virtualMachineExtensions/virtualMachineExtensions.json'], '/'),
            deploymentName: 'vmext'
        },
        {
            type: 'VirtualNetwork',
            process: application.require('./core/virtualNetworkSettings').process,
            defaultsFilename: 'virtualNetworkSettings.json',
            template: _.join([baseUri, 'buildingBlocks/virtualNetworks/virtualNetworks.json'], '/'),
            deploymentName: 'vnet'
        },
        {
            type: 'VirtualNetworkGateway',
            process: application.require('./core/virtualNetworkGatewaySettings').process,
            defaultsFilename: 'virtualNetworkGatewaySettings.json',
            template: _.join([baseUri, 'buildingBlocks/virtualNetworkGateways/virtualNetworkGateways.json'], '/'),
            deploymentName: 'vngw'
        },
        {
            type: 'Connection',
            process: application.require('./core/connectionSettings').process,
            defaultsFilename: 'connectionSettings.json',
            template: _.join([baseUri, 'buildingBlocks/connections/connections.json'], '/'),
            deploymentName: 'conn'
        }
    ];
};