// ServiceNow ITOM Event Field Mapping - Advanced Script for Dell PowerStore SNMP Traps
// This script intercepts SNMP traps from Dell PowerStore storage arrays and creates properly formatted alerts

(function() {
    
    // Dell PowerStore Enterprise OID prefixes
    var DELL_ENTERPRISE_OID = '1.3.6.1.4.1.674';
    var DELL_POWERSTORE_OID = '1.3.6.1.4.1.674.11000.2000'; // Dell PowerStore specific
    var DELL_STORAGE_OID = '1.3.6.1.4.1.674.10893'; // Dell Storage Management
    
    // Trap OID to severity and category mapping - Dell PowerStore trap OIDs
    var trapInfoMap = {
        // Critical severity traps - Storage failures
        '1.3.6.1.4.1.674.11000.2000.100.1001': { severity: 1, name: 'PowerStore Array Offline', category: 'Storage', component: 'Array' },
        '1.3.6.1.4.1.674.11000.2000.100.1002': { severity: 1, name: 'PowerStore Volume Offline', category: 'Storage', component: 'Volume' },
        '1.3.6.1.4.1.674.11000.2000.100.1003': { severity: 1, name: 'PowerStore Drive Failed', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.674.11000.2000.100.1004': { severity: 1, name: 'PowerStore Node Failed', category: 'Storage', component: 'Node' },
        '1.3.6.1.4.1.674.11000.2000.100.1005': { severity: 1, name: 'PowerStore Protection Policy Failed', category: 'Storage', component: 'Protection' },
        '1.3.6.1.4.1.674.11000.2000.100.1006': { severity: 1, name: 'PowerStore Replication Failed', category: 'Storage', component: 'Replication' },
        
        // Major severity traps - Performance and connectivity issues
        '1.3.6.1.4.1.674.11000.2000.100.2001': { severity: 2, name: 'PowerStore Volume Performance Degraded', category: 'Performance', component: 'Volume' },
        '1.3.6.1.4.1.674.11000.2000.100.2002': { severity: 2, name: 'PowerStore Host Connectivity Issue', category: 'Network', component: 'Host' },
        '1.3.6.1.4.1.674.11000.2000.100.2003': { severity: 2, name: 'PowerStore Drive Predictive Failure', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.674.11000.2000.100.2004': { severity: 2, name: 'PowerStore Space Low Warning', category: 'Capacity', component: 'Space' },
        
        // Minor severity traps - Status changes and informational
        '1.3.6.1.4.1.674.11000.2000.100.3001': { severity: 3, name: 'PowerStore Volume Created', category: 'Storage', component: 'Volume' },
        '1.3.6.1.4.1.674.11000.2000.100.3002': { severity: 3, name: 'PowerStore Volume Modified', category: 'Storage', component: 'Volume' },
        '1.3.6.1.4.1.674.11000.2000.100.3003': { severity: 3, name: 'PowerStore Host Added', category: 'Network', component: 'Host' },
        '1.3.6.1.4.1.674.11000.2000.100.3004': { severity: 3, name: 'PowerStore Snapshot Created', category: 'Storage', component: 'Snapshot' },
        
        // Warning severity traps - Threshold alerts
        '1.3.6.1.4.1.674.11000.2000.100.4001': { severity: 4, name: 'PowerStore Space Usage High', category: 'Capacity', component: 'Space' },
        '1.3.6.1.4.1.674.11000.2000.100.4002': { severity: 4, name: 'PowerStore IOPS Threshold Exceeded', category: 'Performance', component: 'IOPS' },
        
        // Info severity traps - Normal operations
        '1.3.6.1.4.1.674.11000.2000.100.5001': { severity: 5, name: 'PowerStore Array Online', category: 'Storage', component: 'Array' },
        '1.3.6.1.4.1.674.11000.2000.100.5002': { severity: 5, name: 'PowerStore Volume Online', category: 'Storage', component: 'Volume' }
    };
    
    // Standard SNMP OIDs
    var standardOIDs = {
        sysUpTime: '1.3.6.1.2.1.1.3.0',
        snmpTrapOID: '1.3.6.1.6.3.1.1.4.1.0',
        sysName: '1.3.6.1.2.1.1.5.0',
        sysDescr: '1.3.6.1.2.1.1.1.0'
    };
    
    // Dell PowerStore-specific OIDs
    var powerstoreOIDs = {
        arraySerialNumber: '1.3.6.1.4.1.674.11000.2000.10.1.1',
        arrayModel: '1.3.6.1.4.1.674.11000.2000.10.1.2',
        arrayName: '1.3.6.1.4.1.674.11000.2000.10.1.3',
        softwareVersion: '1.3.6.1.4.1.674.11000.2000.10.1.4',
        clusterName: '1.3.6.1.4.1.674.11000.2000.20.1.1',
        clusterState: '1.3.6.1.4.1.674.11000.2000.20.1.2',
        volumeName: '1.3.6.1.4.1.674.11000.2000.30.1.1',
        volumeState: '1.3.6.1.4.1.674.11000.2000.30.1.3',
        usedSpace: '1.3.6.1.4.1.674.11000.2000.30.1.4'
    };
    
    /**
     * Main function to process Dell PowerStore SNMP trap
     */
    function processPowerStoreTrap() {
        try {
            if (!isPowerStoreTrap()) return;
            
            var trapOID = getTrapOID();
            var trapInfo = getTrapInfo(trapOID);
            var sourceNode = getSourceNode();
            
            // Set basic event fields
            event.source = sourceNode;
            event.node = sourceNode;
            event.type = 'Dell PowerStore Storage Alert';
            event.resource = getResource();
            
            setSeverityAndDescription(trapInfo, trapOID);
            setAssignmentGroup(trapInfo);
            setAdditionalFields(trapInfo);
            parseVarbinds();
            setCorrelationInfo(trapInfo);
            
        } catch (error) {
            gs.log('Error processing Dell PowerStore SNMP trap: ' + error.toString(), 'Dell PowerStore Trap Handler');
        }
    }
    
    function isPowerStoreTrap() {
        var trapOID = getTrapOID();
        return trapOID && (trapOID.indexOf(DELL_POWERSTORE_OID) === 0 || 
                          trapOID.indexOf(DELL_STORAGE_OID) === 0 ||
                          (trapOID.indexOf(DELL_ENTERPRISE_OID) === 0 && 
                           event.additional_info && 
                           event.additional_info.toLowerCase().indexOf('powerstore') >= 0));
    }
    
    function getTrapOID() {
        var varbinds = event.additional_info || '';
        var trapOIDMatch = varbinds.match(new RegExp(standardOIDs.snmpTrapOID + '\\s*=\\s*([\\d\\.]+)'));
        return trapOIDMatch ? trapOIDMatch[1] : null;
    }
    
    function getTrapInfo(trapOID) {
        return trapInfoMap[trapOID] || {
            severity: 3,
            name: 'Unknown PowerStore Trap',
            category: 'Storage',
            component: 'Unknown'
        };
    }
    
    function getSourceNode() {
        var varbinds = event.additional_info || '';
        var hostname = null;
        
        var sysNameMatch = varbinds.match(new RegExp(standardOIDs.sysName + '\\s*=\\s*([^\\r\\n]+)'));
        if (sysNameMatch) {
            hostname = sysNameMatch[1].trim();
        }
        
        if (!hostname) {
            var arrayNameMatch = varbinds.match(new RegExp(powerstoreOIDs.arrayName + '\\s*=\\s*([^\\r\\n]+)'));
            if (arrayNameMatch) {
                hostname = arrayNameMatch[1].trim();
            }
        }
        
        if (!hostname && event.source) {
            hostname = event.source.toString();
        }
        
        return hostname ? cleanHostname(hostname) : 'Unknown PowerStore Array';
    }
    
    function cleanHostname(hostname) {
        if (!hostname) return hostname;
        
        var cleanedName = hostname.toString().trim();
        var suffixPatterns = [
            /-powerstore$/i, /-ps$/i, /-storage$/i, /-mgmt$/i, 
            /-cluster$/i, /-node\d+$/i, /-array$/i, /-san$/i
        ];
        
        for (var i = 0; i < suffixPatterns.length; i++) {
            if (suffixPatterns[i].test(cleanedName)) {
                cleanedName = cleanedName.replace(suffixPatterns[i], '');
                break;
            }
        }
        
        cleanedName = cleanedName.replace(/[-\\.]+$/, '');
        return cleanedName.length === 0 ? hostname : cleanedName;
    }
    
    function getResource() {
        var varbinds = event.additional_info || '';
        var modelMatch = varbinds.match(new RegExp(powerstoreOIDs.arrayModel + '\\s*=\\s*([^\\r\\n]+)'));
        return modelMatch ? modelMatch[1].trim() : 'Dell PowerStore';
    }
    
    function setSeverityAndDescription(trapInfo, trapOID) {
        event.severity = trapInfo.severity;
        event.description = trapInfo.name + ' (Trap OID: ' + trapOID + ')';
        event.short_description = trapInfo.name + ' on ' + getSourceNode();
    }
    
    function setAssignmentGroup(trapInfo) {
        switch (trapInfo.category.toLowerCase()) {
            case 'storage':
            case 'capacity':
            case 'replication':
            case 'protection':
                event.assignment_group = 'Storage-Support';
                break;
            case 'network':
                event.assignment_group = 'Network-Support';
                break;
            case 'performance':
                event.assignment_group = 'Storage-Performance';
                break;
            case 'security':
            case 'management':
                event.assignment_group = 'Storage-Management';
                break;
            default:
                event.assignment_group = 'Storage-Support';
        }
    }
    
    function setAdditionalFields(trapInfo) {
        event.category = trapInfo.category;
        event.subcategory = 'Dell PowerStore';
        event.u_vendor = 'Dell';
        event.u_component_type = trapInfo.component;
        event.priority = mapSeverityToPriority(event.severity);
    }
    
    function mapSeverityToPriority(severity) {
        switch (severity) {
            case 1: return 1;
            case 2: return 2;
            case 3: return 3;
            case 4: return 4;
            default: return 5;
        }
    }
    
    function parseVarbinds() {
        var varbinds = event.additional_info || '';
        
        var serialMatch = varbinds.match(new RegExp(powerstoreOIDs.arraySerialNumber + '\\s*=\\s*([^\\r\\n]+)'));
        if (serialMatch) {
            event.u_array_serial = serialMatch[1].trim();
        }
        
        var modelMatch = varbinds.match(new RegExp(powerstoreOIDs.arrayModel + '\\s*=\\s*([^\\r\\n]+)'));
        if (modelMatch) {
            event.u_array_model = modelMatch[1].trim();
        }
        
        var versionMatch = varbinds.match(new RegExp(powerstoreOIDs.softwareVersion + '\\s*=\\s*([^\\r\\n]+)'));
        if (versionMatch) {
            event.u_software_version = versionMatch[1].trim();
        }
        
        var clusterNameMatch = varbinds.match(new RegExp(powerstoreOIDs.clusterName + '\\s*=\\s*([^\\r\\n]+)'));
        if (clusterNameMatch) {
            event.u_cluster_name = clusterNameMatch[1].trim();
        }
        
        var volumeNameMatch = varbinds.match(new RegExp(powerstoreOIDs.volumeName + '\\s*=\\s*([^\\r\\n]+)'));
        if (volumeNameMatch) {
            event.u_volume_name = volumeNameMatch[1].trim();
        }
        
        var usedSpaceMatch = varbinds.match(new RegExp(powerstoreOIDs.usedSpace + '\\s*=\\s*([^\\r\\n]+)'));
        if (usedSpaceMatch) {
            event.u_used_space = usedSpaceMatch[1].trim();
        }
        
        event.u_snmp_varbinds = varbinds;
    }
    
    function setCorrelationInfo(trapInfo) {
        var sourceNode = getSourceNode();
        event.correlation_id = 'PowerStore_' + sourceNode + '_' + trapInfo.component;
        event.message_key = sourceNode + '_PowerStore_' + trapInfo.category;
    }
    
    function addWorkNotes() {
        var workNote = 'Dell PowerStore SNMP Trap Processed:\\n';
        workNote += '- Source: ' + event.source + '\\n';
        workNote += '- Component: ' + event.u_component_type + '\\n';
        workNote += '- Severity: ' + getSeverityText(event.severity) + '\\n';
        
        if (event.u_array_serial) {
            workNote += '- Array Serial: ' + event.u_array_serial + '\\n';
        }
        if (event.u_cluster_name) {
            workNote += '- Cluster: ' + event.u_cluster_name + '\\n';
        }
        if (event.u_volume_name) {
            workNote += '- Volume: ' + event.u_volume_name + '\\n';
        }
        
        event.work_notes = workNote;
    }
    
    function getSeverityText(severity) {
        switch (severity) {
            case 1: return 'Critical';
            case 2: return 'Major';
            case 3: return 'Minor';
            case 4: return 'Warning';
            case 5: return 'Info';
            default: return 'Unknown';
        }
    }
    
    // Execute the main processing function
    processPowerStoreTrap();
    addWorkNotes();
    
})();