# Sysops Alerting Rules for Grafana Labs

This repository contains flexible alerting rules for filesystem monitoring that can be deployed via Azure DevOps (ADO) pipelines to Grafana Labs.

## Overview

The solution provides three different approaches for managing filesystem alerting rules with variables:

1. **Basic Approach** (`sysops_alerting_rules.yaml`)
2. **Advanced YAML Anchors** (`sysops_alerting_rules_advanced.yaml`)
3. **Template-based with ADO Variables** (`sysops_alerting_rules_template.yaml`)

## File Structure

```
.
├── sysops_alerting_rules.yaml              # Basic approach with explicit rules
├── sysops_alerting_rules_advanced.yaml     # YAML anchors for maintainability
├── sysops_alerting_rules_template.yaml     # Template with ADO variable substitution
├── azure-pipelines.yml                     # Example ADO pipeline
└── README.md                               # This documentation
```

## Approaches Explained

### 1. Basic Approach (`sysops_alerting_rules.yaml`)

**When to use**: Simple setups with few hosts and filesystems.

**Features**:
- Explicit rules for each host-filesystem combination
- Easy to understand and debug
- Direct promtool validation

**Example**:
```yaml
- alert: HighFilesystemUsage_admbadm001_root
  expr: >
    (
      (
        node_filesystem_size_bytes{instance="admbadm001", mountpoint="/"} - 
        node_filesystem_avail_bytes{instance="admbadm001", mountpoint="/"}
      ) / 
      node_filesystem_size_bytes{instance="admbadm001", mountpoint="/"} * 100
    ) > 85
```

### 2. Advanced YAML Anchors (`sysops_alerting_rules_advanced.yaml`)

**When to use**: Medium complexity setups where you want to reduce duplication.

**Features**:
- Uses YAML anchors (`&`) and aliases (`*`) for reusability
- Reduces duplication of common settings
- Still validates directly with promtool

**Example**:
```yaml
_common_settings: &common_filesystem_settings
  for: 5m
  labels:
    severity: warning
    alert_type: filesystem_usage

# Rule using the anchor
- alert: HighFilesystemUsage_admbadm001_root
  <<: *common_filesystem_settings
  expr: >
    # ... expression here
```

### 3. Template-based with ADO Variables (`sysops_alerting_rules_template.yaml`)

**When to use**: Complex environments with many hosts, multiple environments, or frequent changes.

**Features**:
- Uses ADO pipeline variables with `#{VARIABLE_NAME}#` syntax
- Supports default values: `#{VARIABLE_NAME|default_value}#`
- Environment-specific configuration
- Requires token replacement in ADO pipeline

**Example**:
```yaml
- alert: HighFilesystemUsage_admbadm001_root
  expr: >
    # ... expression > #{FILESYSTEM_WARNING_THRESHOLD|85}#
  for: #{ALERT_FOR_DURATION|5m}#
  labels:
    severity: #{ALERT_SEVERITY|warning}#
    environment: "#{ENVIRONMENT|production}#"
```

## Host-Filesystem Configuration

### Current Configuration

| Host | Filesystems |
|------|-------------|
| admbadm001 | `/`, `/usr/opt` |
| admbdbs001 | `/datadevices`, `/sybdata` |

### Adding New Hosts

1. **Basic Approach**: Add new alert rules following the existing pattern
2. **Advanced Approach**: Add new rules using the existing anchors
3. **Template Approach**: Update ADO pipeline variables

## ADO Pipeline Integration

### Required Variables

Configure these variables in your ADO pipeline or variable groups:

```yaml
variables:
  # Thresholds
  FILESYSTEM_WARNING_THRESHOLD: "85"
  FILESYSTEM_CRITICAL_THRESHOLD: "95"
  DATABASE_FILESYSTEM_WARNING_THRESHOLD: "80"
  
  # Timing
  ALERT_FOR_DURATION: "5m"
  CRITICAL_ALERT_FOR_DURATION: "2m"
  
  # Environment
  ENVIRONMENT: "production"
  RUNBOOK_BASE_URL: "https://your-company.github.io/runbooks"
```

### Pipeline Steps

1. **Token Replacement**: Use `replacetokens@3` task to substitute variables
2. **Validation**: Use `promtool check rules` to validate syntax
3. **Deployment**: Deploy to Grafana Labs using API or provisioning

## Prometheus Expression Breakdown

The filesystem usage expression used in all approaches:

```promql
(
  (
    node_filesystem_size_bytes{instance="HOST", mountpoint="FILESYSTEM"} - 
    node_filesystem_avail_bytes{instance="HOST", mountpoint="FILESYSTEM"}
  ) / 
  node_filesystem_size_bytes{instance="HOST", mountpoint="FILESYSTEM"} * 100
) > THRESHOLD
```

**Components**:
- `node_filesystem_size_bytes`: Total filesystem size
- `node_filesystem_avail_bytes`: Available space
- Result: Percentage of used space
- `fstype!="tmpfs"`: Excludes temporary filesystems

## Alert Types Included

### 1. Filesystem Usage Alerts
- **Warning**: >85% usage (configurable)
- **Critical**: >95% usage (configurable)
- **Database-specific**: Lower thresholds for database filesystems

### 2. Inode Usage Alerts
- **Warning**: >85% inode usage
- **Critical**: >95% inode usage

### 3. Pattern-based Alerts
- Common filesystem patterns: `/`, `/var`, `/usr`, `/tmp`, `/home`, `/opt`
- Database patterns: `/data*`, `/syb*`

## Validation with promtool

### Local Validation
```bash
# Install promtool
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xzf prometheus-2.45.0.linux-amd64.tar.gz
sudo cp prometheus-2.45.0.linux-amd64/promtool /usr/local/bin/

# Validate rules
promtool check rules sysops_alerting_rules.yaml
promtool check rules sysops_alerting_rules_advanced.yaml

# For template files, replace tokens first
promtool check rules sysops_alerting_rules_template.yaml
```

### Pipeline Validation
The ADO pipeline automatically validates all rule files using promtool before deployment.

## Deployment Options

### 1. Grafana API
```bash
curl -X POST \
  -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @alerting_rules.yaml \
  "$GRAFANA_URL/api/ruler/grafana/api/v1/rules/grafana"
```

### 2. Grafana Provisioning
Copy files to Grafana's provisioning directory and restart.

### 3. Infrastructure as Code
Use Terraform, Ansible, or other IaC tools to deploy rules.

## Best Practices

1. **Start Simple**: Begin with the basic approach and evolve as needed
2. **Test Locally**: Always validate with promtool before committing
3. **Use Variable Groups**: Store sensitive values in ADO variable groups
4. **Environment-specific Rules**: Use different thresholds for different environments
5. **Documentation**: Keep runbook URLs updated in annotations
6. **Monitoring**: Monitor the alerts themselves to ensure they're firing correctly

## Troubleshooting

### Common Issues

1. **YAML Syntax Errors**
   - Use `promtool check rules` to identify syntax issues
   - Ensure proper indentation (spaces, not tabs)

2. **Variable Substitution Failures**
   - Check ADO pipeline variable names match template placeholders
   - Ensure `replacetokens@3` task is configured correctly

3. **Prometheus Expression Errors**
   - Test expressions in Prometheus/Grafana query interface
   - Check metric names and labels exist in your environment

### Debugging Tips

```bash
# Test a specific expression
promtool query instant 'node_filesystem_size_bytes{instance="admbadm001"}'

# Check rule syntax
promtool check rules --lint rules.yaml

# Validate specific rule group
promtool check rules rules.yaml | grep "group_name"
```

## Contributing

When adding new hosts or filesystems:

1. Update the appropriate YAML file(s)
2. Update this README with new host-filesystem mappings
3. Test with promtool locally
4. Ensure ADO pipeline passes validation
5. Update any environment-specific variables

## Security Considerations

- Store Grafana API tokens in ADO secure variables
- Use least-privilege access for service accounts
- Regularly rotate API credentials
- Review alert rules for sensitive information exposure