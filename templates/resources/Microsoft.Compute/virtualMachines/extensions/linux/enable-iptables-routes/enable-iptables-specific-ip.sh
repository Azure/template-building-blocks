#!/bin/bash
bash -c "echo net.ipv4.ip_forward=1 >> /etc/sysctl.conf"
sysctl -p /etc/sysctl.conf

PIP_IP_ADDRESS=$1
ILB_IP_ADDRESS=$2

iptables -F
iptables -t nat -F
iptables -X
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination "${ILB_IP_ADDRESS}:80"
iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to-destination "${ILB_IP_ADDRESS}:443"
iptables -t nat -A POSTROUTING -p tcp -d $ILB_IP_ADDRESS --dport 80 -j SNAT --to-source $PIP_IP_ADDRESS
iptables -t nat -A POSTROUTING -p tcp -d $ILB_IP_ADDRESS --dport 443 -j SNAT --to-source $PIP_IP_ADDRESS

service ufw stop
service ufw start

DEBIAN_FRONTEND=noninteractive aptitude install -y -q iptables-persistent
/etc/init.d/iptables-persistent save
update-rc.d iptables-persistent defaults