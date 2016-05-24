#!/bin/sh
source /usr/bin/rhcsh
ctl_app restart --cart nodejs-0.10
echo "bunny restarted"

# in /var/lib/openshift//app-root/repo/.openshift/cron/minutely/ directory under your user name
# execute permissions:
# chmod 711 restart.sh
