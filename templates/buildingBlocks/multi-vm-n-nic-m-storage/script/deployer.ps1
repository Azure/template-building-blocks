Login-AzureRmAccount
Select-AzureRmSubscription -SubscriptionId '6df485a0-aafa-4020-893d-32e833d056d6'

#############################################################################
# Make sure that the following parameters match the ones in the template

$resourceGroupName='app13-rg'
$deploymentName='app13-rg-dep'
$location='West US'

$vnetName='app13-vnet'
$subnetName1='app13-fe-subnet'
$subnetName2='app13-be-subnet'
$avsetName='app13-web-avSet'

$vnetAddressPrefix='10.4.0.0/16'
$subnetAddressPrefix1='10.4.0.0/24'
$subnetAddressPrefix2='10.4.1.0/24'
$diagStorage='app13devdiag'
$vhdStorage='app13devvmst'

# Create new resource group
New-AzureRmResourceGroup -Name $resourceGroupName -Location $location

# Set subnet config
$subNet1=New-AzureRmVirtualNetworkSubnetConfig -Name $subnetName1 -AddressPrefix $subnetAddressPrefix1
$subNet2=New-AzureRmVirtualNetworkSubnetConfig -Name $subnetName2 -AddressPrefix $subnetAddressPrefix2


# Create a new VNet
New-AzureRmVirtualNetwork -Name $vnetName -ResourceGroupName $resourceGroupName -AddressPrefix $vnetAddressPrefix  -Location $location -Subnet $subNet1, $subNet2

# Create a new availability set
New-AzureRmAvailabilitySet -ResourceGroupName $resourceGroupName -Name $avsetName -Location $location -PlatformUpdateDomainCount 5 -PlatformFaultDomainCount 3

# Create storage accounts
New-AzureRmStorageAccount -ResourceGroupName $resourceGroupName -Name $diagStorage -Type Standard_LRS -Location $location
New-AzureRmStorageAccount -ResourceGroupName $resourceGroupName -Name $vhdStorage -Type Premium_LRS -Location $location


# Template and first parameter file URIs
$templateUri = 'https://raw.githubusercontent.com/mspnp/blueprints/refarch/buildingblocks/ARMBuildingBlocks/ARMBuildingBlocks/Templates/resources/virtualMachines/n-vm-n-nic.json'
$templateLocalParam='C:\dev\bbtest\n-vm-n-nic.parameters.json'

Test-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateUri $templateUri -TemplateParameterFile $templateLocalParam
New-AzureRmResourceGroupDeployment -Name $deploymentName -ResourceGroupName $resourceGroupName -TemplateUri $templateUri -TemplateParameterFile $templateLocalParam -Verbose
