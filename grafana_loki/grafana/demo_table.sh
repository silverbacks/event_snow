#!/bin/bash

# Demo script to show table format
echo "Grafana Cloud Host Connectivity Checker - Table Output Example"
echo "================================================================"
echo ""
echo "┌──────────────────┬──────┬─────┬─────────┐"
echo "│ HOST             │ PROD │ DEV │ MISSING │"
echo "├──────────────────┼──────┼─────┼─────────┤"
echo -e "│ web-server-01    │ \033[0;32m ✓   \033[0m│ \033[0;32m✓  \033[0m │ \033[0;32m  ✗    \033[0m │"  # Both
echo -e "│ database-01      │ \033[0;32m ✓   \033[0m│ \033[0;31m✗  \033[0m │ \033[0;32m  ✗    \033[0m │"  # Prod only
echo -e "│ api-gateway-01   │ \033[0;31m ✗   \033[0m│ \033[0;32m✓  \033[0m │ \033[0;32m  ✗    \033[0m │"  # Dev only
echo -e "│ \033[0;31mcache-server-01\033[0m  │ \033[0;31m ✗   \033[0m│ \033[0;31m✗  \033[0m │ \033[0;31m  ✓    \033[0m │"  # Missing
echo -e "│ monitoring-01    │ \033[0;32m ✓   \033[0m│ \033[0;32m✓  \033[0m │ \033[0;32m  ✗    \033[0m │"  # Both
echo "└──────────────────┴──────┴─────┴─────────┘"
echo ""
echo -e "\033[0;32m[SUCCESS]\033[0m Table Legend:"
echo "  ✓ = Reporting to environment"
echo "  ✗ = Not reporting to environment"
echo ""
echo -e "\033[0;32m[INFO]\033[0m Summary Statistics:"
echo "====================================="
echo -e "\033[0;32m[SUCCESS]\033[0m Total hosts checked: 5"
echo -e "\033[0;32m[SUCCESS]\033[0m Reporting to PROD: 3"
echo -e "\033[0;32m[SUCCESS]\033[0m Reporting to DEV: 3"
echo -e "\033[0;32m[SUCCESS]\033[0m Reporting to BOTH: 2"
echo -e "\033[0;32m[SUCCESS]\033[0m Total reporting hosts: 4"
echo -e "\033[0;31m[ERROR]\033[0m Missing hosts: 1"
echo ""
echo -e "\033[0;33m[WARNING]\033[0m Hosts not reporting to any Grafana Cloud instance:"
echo -e "  \033[0;31m✗\033[0m cache-server-01"
echo ""
echo -e "\033[0;32m[INFO]\033[0m Email notification sent to admin@example.com for missing hosts"