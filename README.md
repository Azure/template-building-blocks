# Template Building Blocks

The AzureCAT - patterns & practices (PnP) Template Building Blocks project provides a series of Azure Resource Manager templates you can use to deploy a collection of resources that, together, make up a building block for larger solutions.

These are the same templates used in the [Reference architectures](http://aka.ms/architecture) guidance provided by the PnP team, and are summarized below. 

|Building block|Link|Description|
|---|---|---|
|Virtual network|[vnet-n-subnet](./templates/buildingBlocks/vnet-n-subnet)|Used to create a virtual network with any number of subnets|
|Network security groups|[networkSecurityGroups](./templates/buildingBlocks/networkSecurityGroups)|Used to create any number of NSGs, and link them to any number of NICs and/or subnets|
|User defined routes|[userDefinedRoutes](./templates/buildingBlocks/userDefinedRoutes)|Used to create any number of UDR tables, and link them to any number of subnets|
|Gateway connection|[vpn-gateway-vpn-connection](./templates/buildingBlocks/vpn-gateway-vpn-connection)|Used to create a VPN or ExpressRoute gateway and necessary connections to another network|
|Virtual machines|[multi-vm-n-nic-m-storage](./templates/buildingBlocks/multi-vm-n-nic-m-storage)|Used to create any number of VMs, each with any number of NICs, and any number of data disks|
|Load balanced workload|[loadBalancer-backend-n-vm](./templates/buildingBlocks/loadBalancer-backend-n-vm)|Used to create a load balancer with a collection of VMs in the backend|
|DMZ|[dmz](./templates/buildingBlocks/dmz)|Used to create a DMZ between an Azure VNet and any other network, or the Internet|

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.






