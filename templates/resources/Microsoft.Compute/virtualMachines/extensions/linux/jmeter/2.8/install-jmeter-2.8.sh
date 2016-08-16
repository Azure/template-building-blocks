#!/bin/bash

trap 'errhandle $LINENO $?' SIGINT ERR

errhandle()
{ 
  echo "Error or Interruption at line ${1} exit code ${2} "
  exit ${2}
}

LOCATION=centralus
IS_MASTER=0
REMOTE_HOSTS=""
while [[ $# > 0 ]]
do
  key="$1"
  case $key in
    -m|--master)
      IS_MASTER=1
      ;;
    -r|--REMOTE_HOSTS)
      REMOTE_HOSTS="$2"
      shift
      ;;
    *)
      echo Unknown option "$1"
      exit 1
    ;;
  esac
  shift
done

apt-get -y update
apt-get -y install jmeter

if [ ${IS_MASTER} -ne 1 ];
then
  iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport 4441 -j ACCEPT

  # Configure ports
  sed -i "s/#client.rmi.localport=0/client.rmi.localport=4441/" /usr/share/jmeter/bin/jmeter.properties
  sed -i "s/#server.rmi.localport=4000/server.rmi.localport=4440/" /usr/share/jmeter/bin/jmeter.properties

  # Set the startup  
  cat << EOF > /etc/init/jmeter.conf
  description "JMeter Service"

  start on starting
  script
    /usr/share/jmeter/bin/jmeter-server
  end script
EOF

  service jmeter start

else
  iptables -A INPUT -p tcp --match multiport --dports 4440:4445 -j ACCEPT
  iptables -A OUTPUT -p tcp --match multiport --dports 4440:4445 -j ACCEPT

  # Configure ports
  sed -i "s/#client.rmi.localport=0/client.rmi.localport=4440/" /usr/share/jmeter/bin/jmeter.properties
  sed -i "s/remote_hosts=127.0.0.1/remote_hosts=${REMOTE_HOSTS}/" /usr/share/jmeter/bin/jmeter.properties
fi
