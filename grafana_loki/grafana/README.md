# Grafana Cloud Host Connectivity Checker

This script checks if hosts are sending data to Grafana Cloud instances by querying the `up` metric for `job=GrafanaAlloyServer`. The script uses hardcoded credentials and checks both dev and prod environments to determine if each host is reporting to either environment.

## Features

- **Beautiful Table Output**: Clean, formatted table showing HOST, PROD, DEV, and MISSING status
- **Email Notifications**: Automatically sends email alerts for hosts not reporting to any environment
- **Dual Environment Checking**: Checks both dev.grafana.net and prod.grafana.net instances
- **Hardcoded Credentials**: No command-line credential options needed
- **Proxy Support**: Corporate environment support (webproxy:8080)
- **Colored Output**: Green checkmarks (✓) for reporting, red crosses (✗) for missing
- **Comprehensive Statistics**: Detailed reporting statistics and summaries
- **Flexible Input**: Comma-separated list or file input

## Prerequisites

- `curl` command-line tool
- `python3` for JSON parsing and URL encoding
- Network access to Grafana Cloud through proxy

## Installation

1. Make the scripts executable:
   ```bash
   chmod +x check_grafana_hosts.sh
   chmod +x quick_check.sh
   ```

## Configuration

The script uses hardcoded credentials for both dev and prod environments. To modify the credentials or email settings, edit the script directly:

```bash
# Edit check_grafana_hosts.sh
# Look for these lines and update with your actual credentials:
readonly DEV_USERNAME="dev_admin"
readonly DEV_PASSWORD="dev_password123"
readonly PROD_USERNAME="prod_admin"
readonly PROD_PASSWORD="prod_password123"

# Email configuration:
readonly EMAIL_TO="admin@example.com"
readonly EMAIL_FROM="monitoring@example.com"
readonly EMAIL_SUBJECT="Grafana Cloud - Hosts Not Reporting Alert"
readonly SMTP_SERVER="smtp.example.com"
```

## Usage

### Basic Usage

**Check specific hosts:**
```bash
./check_grafana_hosts.sh -h "host1,host2,host3"
```

**Check hosts from file:**
```bash
./check_grafana_hosts.sh -f hosts.txt
```

### Quick Check (no configuration needed)

Since credentials are hardcoded, you can run the script directly:
```bash
./check_grafana_hosts.sh -f sample_hosts.txt
```

### Command Line Options

- `-h, --hosts`: Comma-separated list of hostnames to check
- `-f, --file`: File containing hostnames (one per line)
- `--help`: Show help message

Note: The script automatically checks both dev and prod environments for each host.

### Host File Format

Create a file with one hostname per line:
```
hostname1
hostname2
server01
web01
db01
```

## Email Notifications

The script automatically sends email notifications when hosts are not reporting to any Grafana Cloud instance.

### Email Features:
- **Automatic Detection**: Emails are sent only when hosts are missing from both environments
- **Multiple Methods**: Tries `sendmail` first, then `mail` command
- **Fallback**: If email fails, saves alert to a timestamped file
- **Detailed Content**: Includes host list, timestamp, and investigation guidance

### Email Configuration:
Edit these variables in the script:
```bash
readonly EMAIL_TO="admin@example.com"        # Recipient email
readonly EMAIL_FROM="monitoring@example.com" # Sender email
readonly EMAIL_SUBJECT="Grafana Cloud - Hosts Not Reporting Alert"
```

### Email Requirements:
- System must have `sendmail` or `mail` command installed
- Proper SMTP configuration on the host system
- If email fails, alerts are saved to files in the script directory

## Table Output Format

The script displays results in a beautiful table format:

| Column | Description |
|--------|-------------|
| HOST | Hostname being checked |
| PROD | ✓ if reporting to prod, ✗ if not |
| DEV | ✓ if reporting to dev, ✗ if not |
| MISSING | ✓ if not reporting anywhere, ✗ if reporting somewhere |

### Color Coding:
- **Green ✓**: Host is reporting to that environment
- **Red ✗**: Host is not reporting to that environment
- **Red hostname**: Host is completely missing from all environments

1. **Query Both Environments**: The script automatically queries both dev.grafana.net and prod.grafana.net using hardcoded credentials
2. **Metric Query**: Uses the query `up{job="GrafanaAlloyServer"} == 1` to find hosts that have reported in the last 30 minutes
3. **Host Extraction**: Extracts hostnames from the `instance`, `hostname`, or `host` labels
4. **Unified Comparison**: Compares the expected host list (containing both dev and prod hosts) against hosts reporting to either environment
5. **Detailed Reporting**: Shows if each host is reporting to:
   - DEV & PROD (both environments)
   - DEV only
   - PROD only
   - Neither (not reporting)

## Output

The script provides:
- Colored status indicators (green for reporting, red for missing)
- Summary of reporting vs missing hosts
- Detailed logging to `grafana_host_check.log`
- Exit code 0 for success, 1 for missing hosts

## Examples

### Example 1: Check Hosts with Table Output
```bash
./check_grafana_hosts.sh -h "web01,web02,db01,cache01"
```

Output:
```
[INFO] Starting Grafana Cloud connectivity check
[INFO] Expected hosts: 4
[INFO] Proxy: webproxy:8080

[INFO] Checking dev environment: https://dev.grafana.net
[SUCCESS] Dev environment query completed. Found 2 active hosts.
[INFO] Checking prod environment: https://prod.grafana.net
[SUCCESS] Prod environment query completed. Found 3 active hosts.
[INFO] Host connectivity analysis:

┌───────────────┬──────┬─────┬─────────┐
│ HOST           │ PROD │ DEV │ MISSING │
├───────────────┼──────┼─────┼─────────┤
│ web01          │  ✓   │ ✓   │   ✗     │
│ web02          │  ✓   │ ✗   │   ✗     │
│ db01           │  ✗   │ ✓   │   ✗     │
│ cache01        │  ✗   │ ✗   │   ✓     │
└───────────────┴──────┴─────┴─────────┘

[INFO] Summary Statistics:
=====================================
[SUCCESS] Total hosts checked: 4
[SUCCESS] Reporting to PROD: 2
[SUCCESS] Reporting to DEV: 2
[SUCCESS] Reporting to BOTH: 1
[SUCCESS] Total reporting hosts: 3
[ERROR] Missing hosts: 1

[WARNING] Hosts not reporting to any Grafana Cloud instance:
  ✗ cache01

[INFO] Sending email notification for missing hosts...
[SUCCESS] Email notification sent successfully using sendmail
[ERROR] Alert: 1 host(s) not reporting to Grafana Cloud!
```

### Example 2: Check Hosts from File
```bash
./check_grafana_hosts.sh -f production_hosts.txt
```

## Troubleshooting

1. **Connection issues**: 
   - Check proxy settings and network connectivity
   - Verify the proxy address is accessible: `curl --proxy webproxy:8080 http://google.com`

2. **Authentication errors**: 
   - Verify username/password are correct
   - Test credentials manually in Grafana Cloud web interface

3. **No data returned**: 
   - Ensure the job name "GrafanaAlloyServer" exists in your metrics
   - Check if hosts are actually sending data to Grafana Cloud
   - Verify the Prometheus data source is correctly configured

4. **Host matching issues**: 
   - The script looks for exact matches or partial matches in instance labels
   - Check the actual instance label format in your Grafana Cloud metrics

5. **Proxy issues**:
   - Ensure the proxy server webproxy:8080 is accessible
   - Verify no authentication is required for the proxy

## Logging

All activities are logged to `grafana_host_check.log` with timestamps for audit purposes. Check this file for detailed information about queries and results.

## API Endpoint

The script queries the following API endpoint format:
```
https://{instance}/api/datasources/proxy/1/api/v1/query?query=up%7Bjob%3D%22GrafanaAlloyServer%22%7D%20%3D%3D%201
```

Where:
- `{instance}` is either dev.grafana.net or prod.grafana.net
- The query is URL-encoded: `up{job="GrafanaAlloyServer"} == 1`
- This filters for hosts that have reported in the last 30 minutes (based on Prometheus staleness)
- Uses HTTP Basic Authentication with provided credentials
- Routes through the specified proxy server