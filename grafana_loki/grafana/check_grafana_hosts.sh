#!/bin/bash

# Grafana Cloud Host Connectivity Checker
# This script checks if hosts are sending data to Grafana Cloud instances
# by querying the 'up' metric for job=GrafanaAlloyServer

set -eo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="${SCRIPT_DIR}/grafana_host_check.log"
readonly PROXY_HOST="webproxy:8080"

# Hardcoded credentials
readonly DEV_USERNAME="dev_admin"
readonly DEV_PASSWORD="dev_password123"
readonly PROD_USERNAME="prod_admin"
readonly PROD_PASSWORD="prod_password123"

# Email configuration
readonly EMAIL_TO="admin@example.com"
readonly EMAIL_FROM="monitoring@example.com"
readonly EMAIL_SUBJECT="Grafana Cloud - Hosts Not Reporting Alert"
readonly SMTP_SERVER="smtp.example.com"

# Grafana Cloud instances
readonly GRAFANA_DEV_URL="https://dev.grafana.net"
readonly GRAFANA_PROD_URL="https://prod.grafana.net"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status="$1"
    local message="$2"
    case "$status" in
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" >&2
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "INFO")
            echo -e "[INFO] $message"
            ;;
    esac
}

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to create formatted table
create_table() {
    local -a hosts=("$@")
    local max_host_len=4  # minimum for "HOST" header
    
    # Find the longest hostname for column width
    for host in "${hosts[@]}"; do
        if [[ ${#host} -gt $max_host_len ]]; then
            max_host_len=${#host}
        fi
    done
    
    # Add padding
    ((max_host_len += 2))
    
    # Create table header
    printf "\n"
    printf "┌─%-${max_host_len}s┬──────┬─────┬─────────┐\n" "$(printf '%*s' $max_host_len | tr ' ' '─')"
    printf "│ %-${max_host_len}s│ PROD │ DEV │ MISSING │\n" "HOST"
    printf "├─%-${max_host_len}s┼──────┼─────┼─────────┤\n" "$(printf '%*s' $max_host_len | tr ' ' '─')"
    
    return 0
}

# Function to add table row
add_table_row() {
    local host="$1"
    local prod_status="$2"
    local dev_status="$3"
    local missing_status="$4"
    local max_host_len="$5"
    
    printf "│ %-${max_host_len}s│  %-4s│ %-3s │   %-5s │\n" "$host" "$prod_status" "$dev_status" "$missing_status"
}

# Function to close table
close_table() {
    local max_host_len="$1"
    printf "└─%-${max_host_len}s┴──────┴─────┴─────────┘\n" "$(printf '%*s' $max_host_len | tr ' ' '─')"
    printf "\n"
}

# Function to send email notification
send_email_notification() {
    local missing_hosts=("$@")
    
    if [[ ${#missing_hosts[@]} -eq 0 ]]; then
        return 0
    fi
    
    local email_body
    email_body=$(cat << EOF
Subject: $EMAIL_SUBJECT
From: $EMAIL_FROM
To: $EMAIL_TO
Content-Type: text/plain; charset=UTF-8

Grafana Cloud Host Monitoring Alert
==================================

The following hosts are NOT reporting to any Grafana Cloud instance:

Date: $(date '+%Y-%m-%d %H:%M:%S')
Environments checked: dev.grafana.net, prod.grafana.net

Missing Hosts:
$(printf '- %s\n' "${missing_hosts[@]}")

Total missing hosts: ${#missing_hosts[@]}

Please investigate these hosts and ensure they are properly configured to send metrics to Grafana Cloud.

This is an automated message from the Grafana Cloud Host Connectivity Checker.
EOF
)
    
    # Try to send email using different methods
    if command -v sendmail >/dev/null 2>&1; then
        echo "$email_body" | sendmail "$EMAIL_TO"
        if [[ $? -eq 0 ]]; then
            print_status "SUCCESS" "Email notification sent successfully using sendmail"
            log_message "Email notification sent to $EMAIL_TO for ${#missing_hosts[@]} missing hosts"
            return 0
        fi
    fi
    
    if command -v mail >/dev/null 2>&1; then
        echo "$email_body" | mail -s "$EMAIL_SUBJECT" "$EMAIL_TO"
        if [[ $? -eq 0 ]]; then
            print_status "SUCCESS" "Email notification sent successfully using mail"
            log_message "Email notification sent to $EMAIL_TO for ${#missing_hosts[@]} missing hosts"
            return 0
        fi
    fi
    
    # If email fails, save to file
    local email_file="${SCRIPT_DIR}/missing_hosts_alert_$(date '+%Y%m%d_%H%M%S').txt"
    echo "$email_body" > "$email_file"
    print_status "WARNING" "Could not send email. Alert saved to: $email_file"
    log_message "Email sending failed. Alert saved to $email_file"
    
    return 1
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -h, --hosts HOSTS          Comma-separated list of hostnames to check
    -f, --file FILE            File containing hostnames (one per line)
    --help                     Show this help message

Features:
    - Beautiful table output showing HOST, PROD, DEV, and MISSING status
    - Automatically checks both dev and prod Grafana Cloud environments
    - Email notifications for hosts not reporting to any instance
    - Colored output with checkmarks (✓) and crosses (✗)

Note: The script checks if hosts are reporting to either dev OR prod environment.

Examples:
    $0 -h "host1,host2,host3"
    $0 -f hosts.txt

EOF
}

# Function to query Grafana Cloud
query_grafana() {
    local instance_url="$1"
    local username="$2"
    local password="$3"
    local query="$4"
    
    local encoded_query
    encoded_query=$(printf '%s' "$query" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))")
    
    local api_url="${instance_url}/api/datasources/proxy/1/api/v1/query?query=${encoded_query}"
    
    local response
    response=$(curl -s \
        --proxy "$PROXY_HOST" \
        --connect-timeout 30 \
        --max-time 60 \
        -u "${username}:${password}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        "$api_url" 2>/dev/null)
    
    if [[ $? -ne 0 ]]; then
        echo "ERROR: Failed to query $instance_url"
        return 1
    fi
    
    echo "$response"
}

# Function to extract active hosts from query response
extract_active_hosts() {
    local response="$1"
    
    # Check if response is valid JSON and contains data using python
    if ! echo "$response" | python3 -c "import sys, json; json.loads(sys.stdin.read())['data']['result']" >/dev/null 2>&1; then
        return 1
    fi
    
    # Extract hostnames from instance labels (no need to filter by value since query already filters for == 1)
    echo "$response" | python3 -c "
import sys, json
data = json.loads(sys.stdin.read())
for result in data.get('data', {}).get('result', []):
    metric = result.get('metric', {})
    hostname = metric.get('instance') or metric.get('hostname') or metric.get('host')
    if hostname:
        print(hostname)
" | sort -u
}

# Function to check hosts against expected list
check_host_status() {
    local expected_hosts=("$@")
    local active_hosts_dev=()
    local active_hosts_prod=()
    
    print_status "INFO" "Querying both Grafana Cloud instances..."
    log_message "Starting host connectivity check for both dev and prod environments"
    
    # Query dev environment
    print_status "INFO" "Checking dev environment: $GRAFANA_DEV_URL"
    local dev_response
    dev_response=$(query_grafana "$GRAFANA_DEV_URL" "$DEV_USERNAME" "$DEV_PASSWORD" 'up{job="GrafanaAlloyServer"} == 1')
    
    if [[ $? -eq 0 ]]; then
        while IFS= read -r host; do
            [[ -n "$host" ]] && active_hosts_dev+=("$host")
        done < <(extract_active_hosts "$dev_response")
        print_status "SUCCESS" "Dev environment query completed. Found ${#active_hosts_dev[@]} active hosts."
        log_message "Dev environment: Found ${#active_hosts_dev[@]} active hosts"
    else
        print_status "ERROR" "Failed to query dev environment"
        log_message "ERROR: Failed to query dev environment"
    fi
    
    # Query prod environment
    print_status "INFO" "Checking prod environment: $GRAFANA_PROD_URL"
    local prod_response
    prod_response=$(query_grafana "$GRAFANA_PROD_URL" "$PROD_USERNAME" "$PROD_PASSWORD" 'up{job="GrafanaAlloyServer"} == 1')
    
    if [[ $? -eq 0 ]]; then
        while IFS= read -r host; do
            [[ -n "$host" ]] && active_hosts_prod+=("$host")
        done < <(extract_active_hosts "$prod_response")
        print_status "SUCCESS" "Prod environment query completed. Found ${#active_hosts_prod[@]} active hosts."
        log_message "Prod environment: Found ${#active_hosts_prod[@]} active hosts"
    else
        print_status "ERROR" "Failed to query prod environment"
        log_message "ERROR: Failed to query prod environment"
    fi
    
    # Combine active hosts from both environments
    local all_active_hosts=()
    all_active_hosts+=("${active_hosts_dev[@]}")
    all_active_hosts+=("${active_hosts_prod[@]}")
    
    # Remove duplicates and sort
    local unique_active_hosts=()
    while IFS= read -r host; do
        [[ -n "$host" ]] && unique_active_hosts+=("$host")
    done < <(printf '%s\n' "${all_active_hosts[@]}" | sort -u)
    
    print_status "INFO" "Host connectivity analysis:"
    
    # Calculate max hostname length for table formatting
    local max_host_len=4  # minimum for "HOST" header
    for host in "${expected_hosts[@]}"; do
        if [[ ${#host} -gt $max_host_len ]]; then
            max_host_len=${#host}
        fi
    done
    ((max_host_len += 2))  # Add padding
    
    # Create table header
    printf "\n"
    printf "┌─%-${max_host_len}s┬──────┬─────┬─────────┐\n" "$(printf '%*s' $max_host_len | tr ' ' '─')"
    printf "│ %-${max_host_len}s│ PROD │ DEV │ MISSING │\n" "HOST"
    printf "├─%-${max_host_len}s┼──────┼─────┼─────────┤\n" "$(printf '%*s' $max_host_len | tr ' ' '─')"
    
    local missing_hosts=()
    local reporting_hosts=()
    local total_dev=0
    local total_prod=0
    local total_both=0
    
    # Check each expected host
    for host in "${expected_hosts[@]}"; do
        local found_in_dev=false
        local found_in_prod=false
        
        # Check if host is in dev environment
        for active_host in "${active_hosts_dev[@]}"; do
            if [[ "$active_host" == "$host" || "$active_host" =~ $host ]]; then
                found_in_dev=true
                break
            fi
        done
        
        # Check if host is in prod environment
        for active_host in "${active_hosts_prod[@]}"; do
            if [[ "$active_host" == "$host" || "$active_host" =~ $host ]]; then
                found_in_prod=true
                break
            fi
        done
        
        # Determine status symbols and counts
        local prod_symbol="✗"
        local dev_symbol="✗"
        local missing_symbol="✗"
        
        if [[ "$found_in_prod" == true ]]; then
            prod_symbol="✓"
            ((total_prod++))
        fi
        
        if [[ "$found_in_dev" == true ]]; then
            dev_symbol="✓"
            ((total_dev++))
        fi
        
        if [[ "$found_in_dev" == true || "$found_in_prod" == true ]]; then
            missing_symbol="✗"
            reporting_hosts+=("$host")
            if [[ "$found_in_dev" == true && "$found_in_prod" == true ]]; then
                ((total_both++))
            fi
        else
            missing_symbol="✓"
            missing_hosts+=("$host")
        fi
        
        # Add table row with colored symbols
        if [[ "$missing_symbol" == "✓" ]]; then
            # Host is missing - red row
            printf "│ \033[0;31m%-${max_host_len}s\033[0m│ \033[0;31m %-4s\033[0m│ \033[0;31m%-3s\033[0m │ \033[0;31m  %-5s\033[0m │\n" "$host" "$prod_symbol" "$dev_symbol" "$missing_symbol"
        else
            # Host is reporting - green symbols for reporting environments
            local prod_display="$prod_symbol"
            local dev_display="$dev_symbol"
            if [[ "$found_in_prod" == true ]]; then
                prod_display="\033[0;32m$prod_symbol\033[0m"
            else
                prod_display="\033[0;31m$prod_symbol\033[0m"
            fi
            if [[ "$found_in_dev" == true ]]; then
                dev_display="\033[0;32m$dev_symbol\033[0m"
            else
                dev_display="\033[0;31m$dev_symbol\033[0m"
            fi
            printf "│ %-${max_host_len}s│ %-10s│ %-9s│ \033[0;32m  %-5s\033[0m │\n" "$host" "$prod_display" "$dev_display" "$missing_symbol"
        fi
        
        # Log the status
        if [[ "$found_in_dev" == true && "$found_in_prod" == true ]]; then
            log_message "Host $host is reporting to both DEV and PROD Grafana Cloud"
        elif [[ "$found_in_dev" == true ]]; then
            log_message "Host $host is reporting to DEV Grafana Cloud only"
        elif [[ "$found_in_prod" == true ]]; then
            log_message "Host $host is reporting to PROD Grafana Cloud only"
        else
            log_message "Host $host is NOT reporting to any Grafana Cloud environment"
        fi
    done
    
    # Close table
    printf "└─%-${max_host_len}s┴──────┴─────┴─────────┘\n" "$(printf '%*s' $max_host_len | tr ' ' '─')"
    printf "\n"
    
    # Print summary with statistics
    print_status "INFO" "Summary Statistics:"
    echo "============================================="
    print_status "SUCCESS" "Total hosts checked: ${#expected_hosts[@]}"
    print_status "SUCCESS" "Reporting to PROD: $total_prod"
    print_status "SUCCESS" "Reporting to DEV: $total_dev"
    print_status "SUCCESS" "Reporting to BOTH: $total_both"
    print_status "SUCCESS" "Total reporting hosts: ${#reporting_hosts[@]}"
    print_status "ERROR" "Missing hosts: ${#missing_hosts[@]}"
    
    if [[ ${#missing_hosts[@]} -gt 0 ]]; then
        echo ""
        print_status "WARNING" "Hosts not reporting to any Grafana Cloud instance:"
        printf '%s\n' "${missing_hosts[@]}" | sed 's/^/  \033[0;31m✗\033[0m /'
        log_message "Missing hosts: ${missing_hosts[*]}"
        
        # Send email notification for missing hosts
        print_status "INFO" "Sending email notification for missing hosts..."
        send_email_notification "${missing_hosts[@]}"
        
        echo ""
        print_status "ERROR" "Alert: ${#missing_hosts[@]} host(s) not reporting to Grafana Cloud!"
        return 1
    else
        print_status "SUCCESS" "All expected hosts are reporting to Grafana Cloud!"
        log_message "All expected hosts are reporting successfully"
        return 0
    fi
}

# Function to parse hosts from comma-separated string
parse_hosts() {
    local host_string="$1"
    IFS=',' read -ra hosts <<< "$host_string"
    printf '%s\n' "${hosts[@]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sort
}

# Function to read hosts from file
read_hosts_from_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        print_status "ERROR" "Host file not found: $file"
        exit 1
    fi
    sort "$file"
}

# Main function
main() {
    local HOSTS=""
    local HOST_FILE=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--hosts)
                HOSTS="$2"
                shift 2
                ;;
            -f|--file)
                HOST_FILE="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_status "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate required parameters
    if [[ -z "$HOSTS" && -z "$HOST_FILE" ]]; then
        print_status "ERROR" "Either hosts list or host file is required"
        show_usage
        exit 1
    fi
    
    # Check dependencies
    if ! command -v curl >/dev/null 2>&1; then
        print_status "ERROR" "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v python3 >/dev/null 2>&1; then
        print_status "ERROR" "python3 is required but not installed"
        exit 1
    fi
    
    # Get host list
    local expected_hosts=()
    if [[ -n "$HOSTS" ]]; then
        while IFS= read -r host; do
            [[ -n "$host" ]] && expected_hosts+=("$host")
        done < <(parse_hosts "$HOSTS")
    elif [[ -n "$HOST_FILE" ]]; then
        while IFS= read -r host; do
            [[ -n "$host" ]] && expected_hosts+=("$host")
        done < <(read_hosts_from_file "$HOST_FILE")
    fi
    
    if [[ ${#expected_hosts[@]} -eq 0 ]]; then
        print_status "ERROR" "No hosts to check"
        exit 1
    fi
    
    print_status "INFO" "Starting Grafana Cloud connectivity check"
    print_status "INFO" "Expected hosts: ${#expected_hosts[@]}"
    print_status "INFO" "Proxy: $PROXY_HOST"
    echo ""
    
    # Perform the check
    check_host_status "${expected_hosts[@]}"
}

# Run main function with all arguments
main "$@"