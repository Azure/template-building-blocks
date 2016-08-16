Login-AzureRmAccount
Select-AzureRmSubscription -SubscriptionId '6df485a0-aafa-4020-893d-32e833d056d6'

#############################################################################
# Make sure that the following parameters match the ones in the template

$resourceGroupName='app1-rg'
$deploymentName='app1-rg-dep'
$location='East US'

$vnetName='app1-vnet'
$subnetIn='app1-in-subnet'
$subnetOut='app1-out-subnet'
#$avsetName='app1-web-as'

$vnetAddressPrefix='10.0.0.0/16'
$subnetInPrefix='10.0.1.0/24'
$subnetOutPrefix='10.0.2.0/24'

#$gatewaySubnetNamePrefix='10.0.255.224/27'

#$storageAccountVhd='app1devvmst'
#$storageAccountDiag='app1devdiag'

#$gatewaySubnetName='GatewaySubnet'

# Create new resource group
$resourceGroup = New-AzureRmResourceGroup -Name $resourceGroupName -Location $location

# Set subnet config
$subNet1=New-AzureRmVirtualNetworkSubnetConfig -Name $subnetIn -AddressPrefix $subnetInPrefix
$subNet2=New-AzureRmVirtualNetworkSubnetConfig -Name $subnetOut -AddressPrefix $subnetOutPrefix
#$subNet3=New-AzureRmVirtualNetworkSubnetConfig -Name $gatewaySubnetName -AddressPrefix $gatewaySubnetNamePrefix

# Create a new VNet
New-AzureRmVirtualNetwork -Name $vnetName -ResourceGroupName $resourceGroup.ResourceGroupName -AddressPrefix $vnetAddressPrefix  -Location $location -Subnet $subNet1, $subNet2 #, $subnet3

# Create VPN gateway with a public IP
#$gwpip= New-AzureRmPublicIpAddress -Name gwpip -ResourceGroupName $resourceGroupName -Location $location -AllocationMethod Dynamic
#$vnet = Get-AzureRmVirtualNetwork -Name $vnetName -ResourceGroupName $resourceGroupName
#$subnet = Get-AzureRmVirtualNetworkSubnetConfig -Name $gatewaySubnetName -VirtualNetwork $vnet
#$gwipconfig = New-AzureRmVirtualNetworkGatewayIpConfig -Name gwipconfig1 -SubnetId $subnet.Id -PublicIpAddressId $gwpip.Id
#New-AzureRmVirtualNetworkGateway -Name vnetgw1 -ResourceGroupName $resourceGroupName -Location $location -IpConfigurations $gwipconfig -GatewayType Vpn -VpnType RouteBased -GatewaySku Standard

# Template and first parameter file URIs
$templateUri = 'https://raw.githubusercontent.com/mspnp/arm-building-blocks/kirpas/nva-buildingBlock/ARMBuildingBlocks/Templates/buildingBlocks/nvas-ntier-network/azuredeploy.json'
$templateParamUri = "https://raw.githubusercontent.com/mspnp/arm-building-blocks/kirpas/nva-buildingBlock/ARMBuildingBlocks/Templates/buildingBlocks/nvas-ntier-network/azuredeploy.parameters.json"
$outputFile = Join-Path (Get-Item -Path ".\" -Verbose).FullName -ChildPath "$resourceGroupName-template-output.json"

$result = Test-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroup.ResourceGroupName -TemplateUri $templateUri -TemplateParameterUri $templateParamUri
if($result.Count -eq 0)
{
	New-AzureRmResourceGroupDeployment -Name $deploymentName -ResourceGroupName $resourceGroup.ResourceGroupName -TemplateUri $templateUri -TemplateParameterUri $templateParamUri | ConvertTo-Json | Out-File $outputFile -Force
}
else
{
    $result
}
	
If($resourceGroup -ne $null)
{
    Write-Host $resourceGroup.ResourceGroupName
    try
    {
        Write-Host "Getting resource group:$resourceGroupName RM virtual machines type resources"
        $azureVMResources = Get-AzureRMVM -ResourceGroupName $resourceGroup.ResourceGroupName -ErrorAction Stop -Verbose
        Write-Host "Count of resource group:$resourceGroupName RM virtual machines type resource is $($azureVMResources.Count)"
    }
    catch [Microsoft.WindowsAzure.Commands.Common.ComputeCloudException],[System.MissingMethodException], [System.Management.Automation.PSInvalidOperationException]
    {
        Write-Host $_.Exception.Message
        throw 
    }
}	

if($azureVMResources -ne $null)
{
    try
    {
        $extensionName = 'nva-configuration'
        $fileUri = 'https://raw.githubusercontent.com/mspnp/arm-building-blocks/kirpas/nva-buildingBlock/ARMBuildingBlocks/Templates/resources/Microsoft.Compute/virtualMachines/extensions/linux/enable-iptables-routes/enable-iptables-routes.sh'
        $run = 'bash enable-iptables-routes.sh'
        $version = 1.8
        foreach($azureVMResource in $azureVMResources)
        {
            Write-Host "Applying custom script extension on: " $azureVMResource.Name
            $result = Set-AzureRmVMCustomScriptExtension -ResourceGroupName $resourceGroup.ResourceGroupName -VMName $azureVMResource.Name -Name $extensionName `
                -FileUri $fileUri  -Run $run -Location $location -TypeHandlerVersion $version -ErrorAction Stop -Verbose
        }
    }
    catch [Microsoft.WindowsAzure.Commands.Common.ComputeCloudException],[System.MissingMethodException], [System.Management.Automation.PSInvalidOperationException]
    {
        Write-Host $_.Exception.Message
        throw 
    }
}
