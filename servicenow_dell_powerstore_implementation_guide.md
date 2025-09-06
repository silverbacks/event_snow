# ServiceNow ITOM Dell PowerStore SNMP Trap Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing Dell PowerStore SNMP trap handling in ServiceNow ITOM Event Management with advanced field mapping and intelligent hostname extraction for storage arrays.

## Prerequisites
- ServiceNow ITOM Event Management license
- Admin access to ServiceNow instance
- Access to Dell support site for MIB file download
- Network connectivity between Dell PowerStore arrays and ServiceNow MID Server
- Dell PowerStore arrays with SNMP enabled

## Phase 1: MIB File Download and Installation

### Step 1: Download Dell PowerStore MIB Files

1. **Access Dell Support Site**:
   - URL: https://www.dell.com/support/
   - Search for "PowerStore MIB files"

2. **Navigate to PowerStore Documentation**:
   - Go to: PowerStore Documentation
   - Select: Administrator Guide
   - Download: SNMP MIB files

3. **Required MIB Files**:
   ```
   Primary MIBs:
   - DELL-POWERSTORE-MIB.txt (Dell PowerStore specific MIB)
   - DELL-STORAGE-MIB.txt (Dell Storage Management MIB)
   - MIB-Dell-10893.mib (Dell Storage Enterprise MIB)
   
   Supporting MIBs:
   - RFC1213-MIB.txt (Standard MIB-II)
   - SNMPv2-MIB.txt (SNMPv2 definitions)
   - SNMPv2-TC.txt (Textual conventions)
   ```

### Step 2: Install MIB Files on MID Server

1. **Copy MIB Files**:
   ```bash
   # On MID Server, create MIB directory structure
   mkdir -p /opt/servicenow/mid/agent/mib/dell/powerstore
   
   # Copy MIB files to MID server
   cp DELL-POWERSTORE-MIB.txt /opt/servicenow/mid/agent/mib/dell/powerstore/
   cp DELL-STORAGE-MIB.txt /opt/servicenow/mid/agent/mib/dell/powerstore/
   cp MIB-Dell-10893.mib /opt/servicenow/mid/agent/mib/dell/powerstore/
   cp RFC1213-MIB.txt /opt/servicenow/mid/agent/mib/standard/
   cp SNMPv2-*.txt /opt/servicenow/mid/agent/mib/standard/
   ```

2. **Configure MID Server MIB Path**:
   - Navigate to: MID Server > Servers
   - Select your MID Server
   - Add parameter: `mid.instance.mib.path=/opt/servicenow/mid/agent/mib`
   - Restart MID Server

## Phase 2: ServiceNow Configuration

### Step 3: Create Custom Fields

1. **Navigate to System Definition > Tables**
2. **Open Event table (em_event)**
3. **Add the following custom fields**:

   | Field | Type | Label | Max Length |
   |-------|------|-------|------------|
   | u_vendor | String | Vendor | 40 |
   | u_array_serial | String | Array Serial Number | 100 |
   | u_array_model | String | Array Model | 100 |
   | u_cluster_name | String | Cluster Name | 100 |
   | u_software_version | String | Software Version | 100 |
   | u_management_ip | String | Management IP | 50 |
   | u_volume_name | String | Volume Name | 100 |
   | u_used_space | String | Used Space | 50 |
   | u_component_type | String | Component Type | 50 |
   | u_iops_read | String | Read IOPS | 50 |
   | u_iops_write | String | Write IOPS | 50 |
   | u_bandwidth_read | String | Read Bandwidth | 50 |
   | u_bandwidth_write | String | Write Bandwidth | 50 |
   | u_latency_read | String | Read Latency | 50 |
   | u_latency_write | String | Write Latency | 50 |
   | u_snmp_varbinds | String (4000) | SNMP Varbinds | 4000 |

### Step 4: Create Assignment Groups

1. **Navigate to User Administration > Groups**
2. **Create/verify the following groups exist**:
   - **Storage-Support**: General storage issues
   - **Network-Support**: Network connectivity issues
   - **Storage-Performance**: Performance-related alerts
   - **Storage-Management**: Management and security issues

3. **Group Configuration**:
   - **Type**: `itil`
   - **Active**: `true`
   - **Add appropriate team members**

### Step 5: Create Event Rule

1. **Navigate to Event Management > Processing > Event Rules**
2. **Create new rule with these settings**:
   - **Name**: `Dell PowerStore SNMP Trap Handler`
   - **Table**: `Event [em_event]`
   - **Active**: `true`
   - **Order**: `130` (after Dell iDRAC and other storage rules)

3. **Condition Script**:
   ```javascript
   // Check if this is a Dell PowerStore SNMP trap
   function evaluateCondition() {
       var dellOID = '1.3.6.1.4.1.674';
       var powerstoreOID = '1.3.6.1.4.1.674.11000.2000';
       var storageOID = '1.3.6.1.4.1.674.10893';
       var additionalInfo = current.additional_info.toString();
       
       return additionalInfo.indexOf(powerstoreOID) >= 0 ||
              additionalInfo.indexOf(storageOID) >= 0 ||
              (additionalInfo.indexOf(dellOID) >= 0 && 
               additionalInfo.toLowerCase().indexOf('powerstore') >= 0);
   }
   
   evaluateCondition();
   ```

4. **Advanced Script**: Copy the entire content from `servicenow_dell_powerstore_trap_handler.js`

### Step 6: Configure SNMP Trap Reception

1. **Navigate to Event Management > Processing > SNMP Trap Receiver**
2. **Configure receiver settings**:
   - **Port**: `162` (standard SNMP trap port)
   - **Community String**: Configure as per your Dell PowerStore settings
   - **MID Server**: Select appropriate MID Server

3. **Create SNMP Credential**:
   - Navigate to: Discovery > Credentials
   - Type: SNMP
   - Community String: (as configured on Dell PowerStore)

## Phase 3: Dell PowerStore Configuration

### Step 7: Configure Dell PowerStore SNMP Settings

1. **Access PowerStore Manager**:
   - Open browser to PowerStore Manager URL
   - Login with administrator credentials

2. **Configure SNMP Settings**:
   - Navigate to: **Settings > Connectivity > SNMP**
   - **Enable SNMP**: `Enabled`
   - **Community String**: Set your community string
   - **SNMP Version**: `v2c` or `v3`

3. **Configure SNMP Trap Destinations**:
   - Navigate to: **Settings > Connectivity > SNMP > Trap Destinations**
   - **Add Destination**: `<mid-server-ip>`
   - **Port**: `162`
   - **Community String**: Same as SNMP community
   - **Trap Types**: Select all relevant trap types

4. **Configure Alerting Rules**:
   - Navigate to: **Settings > Alerting**
   - **Enable SNMP Traps**: `Enabled`
   - **Configure severity levels** for different event types
   - **Set thresholds** for performance and capacity alerts

### Step 8: Configure PowerStore CLI (Optional)

1. **Install PowerStore CLI** (if needed for testing):
   ```bash
   # Download from Dell Support
   # Install according to documentation
   ```

2. **Test SNMP Configuration**:
   ```bash
   # Test SNMP connectivity
   pstcli -u admin -p password snmp get community
   
   # Test trap destination
   pstcli -u admin -p password snmp test-trap <mid-server-ip>
   ```

### Step 9: Test SNMP Connectivity

1. **Test from PowerStore CLI**:
   ```bash
   # Test SNMP configuration
   pstcli snmp get
   
   # Generate test trap
   pstcli snmp test-trap <mid-server-ip>
   ```

2. **Test from PowerStore Manager**:
   - Navigate to: **Settings > Connectivity > SNMP**
   - Click **Test** button for configured trap destinations

3. **Verify in ServiceNow**:
   - Navigate to: Event Management > Events
   - Look for test events from PowerStore arrays

## Phase 4: Testing and Validation

### Step 10: Create Test Scenarios

1. **Generate PowerStore Test Events**:
   - **PowerStore Manager**: Use test alert generation
   - **CLI Testing**: Use `pstcli snmp test-trap` command

2. **Simulate Storage Events** (in test environment):
   ```bash
   # Generate volume events
   pstcli volume create --name test-volume --size 10GB
   pstcli volume delete --name test-volume
   
   # Generate capacity alerts (if thresholds configured)
   # Monitor space usage and trigger alerts
   ```

3. **Monitor ServiceNow Events**:
   - Check Event Management > Events
   - Verify proper field mapping
   - Confirm assignment to appropriate groups

### Step 11: Validate Event Processing

**Test Checklist**:
- [ ] Events are received from PowerStore arrays
- [ ] Trap OID is correctly identified
- [ ] Severity is properly mapped
- [ ] Description includes trap OID and component details
- [ ] Assignment group is set correctly based on component type
- [ ] Custom fields are populated (array serial, cluster, volume info)
- [ ] Hostname is cleaned of PowerStore suffixes
- [ ] Correlation ID is generated
- [ ] Work notes include relevant details

## Phase 5: Monitoring and Maintenance

### Step 12: Set Up Monitoring Dashboard

1. **Create Dashboard**:
   - Navigate to: Performance Analytics > Dashboards
   - Create Dell PowerStore Events dashboard
   - Include widgets for:
     - Event volume by severity
     - Top PowerStore arrays by event count
     - Performance alerts by array
     - Capacity utilization alerts

2. **Configure Alerts**:
   - Set up email notifications for critical PowerStore events
   - Configure escalation rules for unassigned storage events
   - Create correlation rules for related storage events

### Step 13: Regular Maintenance Tasks

1. **Weekly Tasks**:
   - Review event processing logs
   - Check for any failed event transformations
   - Validate assignment group distribution
   - Monitor hostname cleaning effectiveness

2. **Monthly Tasks**:
   - Review and update severity mappings
   - Analyze storage event patterns and trends
   - Update trap OID mappings for new software versions
   - Validate array serial correlation with CMDB

3. **Quarterly Tasks**:
   - Update MIB files for new PowerStore software versions
   - Review and optimize event rules
   - Audit SNMP security settings
   - Update documentation

## Troubleshooting Guide

### Common Issues and Solutions

1. **Events not appearing in ServiceNow**:
   - **Check**: MID Server connectivity to PowerStore arrays
   - **Verify**: SNMP configuration on PowerStore
   - **Review**: Firewall rules (port 162)
   - **Test**: SNMP community string authentication

2. **Incorrect event parsing**:
   - **Validate**: JavaScript syntax in event rule
   - **Check**: MIB file installation and paths
   - **Review**: additional_info field format
   - **Verify**: Dell PowerStore OID detection

3. **Assignment group issues**:
   - **Verify**: Assignment groups exist and are active
   - **Check**: Group type is 'itil'
   - **Ensure**: Group has proper permissions
   - **Review**: Component categorization logic

4. **Hostname cleaning not working**:
   - **Check**: Regular expression patterns
   - **Verify**: sysName varbind format
   - **Review**: Fallback hostname sources
   - **Test**: Pattern matching with actual hostnames

5. **Missing custom field data**:
   - **Verify**: PowerStore-specific OID mappings
   - **Check**: Varbind parsing regular expressions
   - **Review**: Array serial and cluster extraction
   - **Test**: OID availability in trap data

### Log Locations

- **MID Server Logs**: `/opt/servicenow/mid/agent/logs/`
- **ServiceNow System Logs**: System Logs > Events
- **Event Processing Logs**: Event Management > Processing
- **PowerStore Logs**: PowerStore Manager > System > Logs

### Debugging Steps

1. **Enable Debug Logging**:
   ```javascript
   // Add to trap handler for debugging
   gs.log('PowerStore Trap Debug: ' + JSON.stringify({
       trapOID: trapOID,
       hostname: getSourceNode(),
       arraySerial: event.u_array_serial,
       severity: event.severity
   }), 'Dell PowerStore Debug');
   ```

2. **Test Event Simulation**:
   ```json
   {
     "source": "powerstore-01-cluster",
     "type": "snmptrap",
     "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.2000.100.1002\n1.3.6.1.2.1.1.5.0 = powerstore-01-cluster\n1.3.6.1.4.1.674.11000.2000.10.1.1 = PS123456\n1.3.6.1.4.1.674.11000.2000.10.1.2 = PowerStore 7000T"
   }
   ```

## Security Best Practices

### SNMP Security
1. **Use SNMPv3** where supported
2. **Secure community strings** for SNMPv2c
3. **Limit SNMP access** by source IP
4. **Regular credential rotation**
5. **Monitor SNMP access logs**

### PowerStore Security
1. **Enable secure protocols** (HTTPS, SSH)
2. **Use strong authentication** (complex passwords, 2FA)
3. **Regular software updates**
4. **Network segmentation** for management interfaces
5. **Audit access logs** regularly

### ServiceNow Security
1. **Role-based access control** for event processing
2. **Audit configuration changes**
3. **Secure storage** of sensitive data
4. **Regular security assessments**

## Performance Optimization

### Event Volume Management
1. **Implement event filtering** for noise reduction
2. **Set up event correlation** to reduce duplicates
3. **Configure appropriate retention policies**
4. **Monitor processing performance**

### Processing Optimization
1. **Monitor event rule execution times**
2. **Optimize JavaScript code** for performance
3. **Consider batch processing** for high volumes
4. **Use efficient regular expressions**

## Integration with CMDB

### Asset Correlation
1. **Use array serial number** as primary correlation key
2. **Map PowerStore model information** to CI classes
3. **Maintain storage inventory** synchronization
4. **Update CI status** based on events

### Configuration Items
1. **Create CI classes** for PowerStore arrays
2. **Map relationships** between volumes and hosts
3. **Maintain accurate** capacity information
4. **Track software versions** and configurations

## Additional Resources

- **Dell Documentation**: docs.dell.com/powerstore
- **ServiceNow Community**: community.servicenow.com
- **Dell PowerStore Manager**: PowerStore administrative interface
- **PowerStore CLI**: Command line interface documentation

## Support Contacts

- **Dell Support**: support.dell.com
- **ServiceNow Support**: support.servicenow.com
- **Internal Storage Team**: Storage-Support assignment group

This comprehensive implementation provides Dell PowerStore SNMP trap handling with intelligent hostname extraction, component-based routing, and detailed performance correlation for effective storage operations management.