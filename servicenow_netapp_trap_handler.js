// ServiceNow ITOM Event Field Mapping - Advanced Script for NetApp CDOT 9.14 SNMP Traps
// This script intercepts SNMP traps from NetApp systems and creates properly formatted alerts

(function() {
    
    // NetApp Enterprise OID prefix
    var NETAPP_ENTERPRISE_OID = '1.3.6.1.4.1.789';
    
    // Trap OID to severity mapping
    var trapSeverityMap = {
        // Critical severity traps
        '1.3.6.1.4.1.789.0.16': { severity: 1, name: 'Temperature Overheat', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.21': { severity: 1, name: 'Disk Failed Shutdown', category: 'Storage' },
        '1.3.6.1.4.1.789.0.31': { severity: 1, name: 'Fan Failure Shutdown', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.41': { severity: 1, name: 'Power Supply Failure Shutdown', category: 'Hardware' },
        
        // Major severity traps
        '1.3.6.1.4.1.789.0.12': { severity: 2, name: 'NVRAM Battery Low', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.13': { severity: 2, name: 'Fan Failure', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.14': { severity: 2, name: 'Power Supply Failure', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.15': { severity: 2, name: 'Disk Failure', category: 'Storage' },
        '1.3.6.1.4.1.789.0.22': { severity: 2, name: 'Disk Failed', category: 'Storage' },
        '1.3.6.1.4.1.789.0.25': { severity: 2, name: 'Volume Offline', category: 'Storage' },
        '1.3.6.1.4.1.789.0.27': { severity: 2, name: 'Aggregate Offline', category: 'Storage' },
        '1.3.6.1.4.1.789.0.33': { severity: 2, name: 'Fan Failed', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.35': { severity: 2, name: 'Cluster Node Down', category: 'Cluster' },
        '1.3.6.1.4.1.789.0.37': { severity: 2, name: 'Cluster Interconnect Down', category: 'Network' },
        '1.3.6.1.4.1.789.0.43': { severity: 2, name: 'Power Supply Failed', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.62': { severity: 2, name: 'NVRAM Battery Discharged', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.63': { severity: 2, name: 'NVRAM Battery Low', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.72': { severity: 2, name: 'Cluster Node Failed', category: 'Cluster' },
        '1.3.6.1.4.1.789.0.82': { severity: 2, name: 'Volume Full', category: 'Storage' },
        '1.3.6.1.4.1.789.0.324': { severity: 2, name: 'Volume Offline', category: 'Storage' },
        '1.3.6.1.4.1.789.0.334': { severity: 2, name: 'Volume Restricted', category: 'Storage' },
        '1.3.6.1.4.1.789.0.482': { severity: 2, name: 'Maxdir Size Alert', category: 'Capacity' },
        
        // Minor severity traps
        '1.3.6.1.4.1.789.0.334': { severity: 3, name: 'Volume Restricted', category: 'Storage' },
        '1.3.6.1.4.1.789.0.364': { severity: 3, name: 'SnapMirror Sync Failed', category: 'Replication' },
        '1.3.6.1.4.1.789.0.35': { severity: 3, name: 'Fan Warning', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.45': { severity: 3, name: 'Power Supply Warning', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.75': { severity: 3, name: 'Cluster Node Taken Over', category: 'Cluster' },
        '1.3.6.1.4.1.789.0.85': { severity: 3, name: 'Volume Nearly Full', category: 'Storage' },
        '1.3.6.1.4.1.789.0.187': { severity: 3, name: 'WAFL Directory Full', category: 'Capacity' },
        '1.3.6.1.4.1.789.0.275': { severity: 3, name: 'Volume State Changed', category: 'Storage' },
        
        // Warning severity traps
        '1.3.6.1.4.1.789.0.29': { severity: 4, name: 'Quota Exceeded', category: 'Capacity' },
        '1.3.6.1.4.1.789.0.176': { severity: 4, name: 'Quota Exceeded', category: 'Capacity' },
        '1.3.6.1.4.1.789.0.485': { severity: 4, name: 'Maxdir Size Warning', category: 'Capacity' },
        
        // Info severity traps (resolved/repaired states)
        '1.3.6.1.4.1.789.0.26': { severity: 5, name: 'Disk Repaired', category: 'Storage' },
        '1.3.6.1.4.1.789.0.36': { severity: 5, name: 'Fan Repaired', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.46': { severity: 5, name: 'Power Supply Repaired', category: 'Hardware' },
        '1.3.6.1.4.1.789.0.76': { severity: 5, name: 'Cluster Node Repaired', category: 'Cluster' },
        '1.3.6.1.4.1.789.0.86': { severity: 5, name: 'Volume Repaired', category: 'Storage' },
        '1.3.6.1.4.1.789.0.276': { severity: 5, name: 'Volume Online', category: 'Storage' },
        '1.3.6.1.4.1.789.0.366': { severity: 5, name: 'SnapMirror Sync OK', category: 'Replication' },
        
        // Minor severity traps
        '1.3.6.1.4.1.789.0.187': { severity: 3, name: 'WAFL Directory Full', category: 'Capacity' },
        
        // Major severity traps (maxdir critical)
        '1.3.6.1.4.1.789.0.482': { severity: 2, name: 'Maxdir Size Alert', category: 'Capacity' }
    };
    
    // Standard SNMP OIDs for varbind parsing
    var standardOIDs = {
        sysUpTime: '1.3.6.1.2.1.1.3.0',
        snmpTrapOID: '1.3.6.1.6.3.1.1.4.1.0',
        sysName: '1.3.6.1.2.1.1.5.0',
        sysDescr: '1.3.6.1.2.1.1.1.0'
    };
    
    // NetApp-specific OIDs
    var netappOIDs = {
        productTrapData: '1.3.6.1.4.1.789.1.2.2.0',
        productSerialNum: '1.3.6.1.4.1.789.1.1.9.0',
        productModel: '1.3.6.1.4.1.789.1.1.5.0',
        productVersion: '1.3.6.1.4.1.789.1.1.2.0'
    };
    
    /**
     * Main function to process NetApp SNMP trap
     */
    function processNetAppTrap() {
        try {
            // Check if this is a NetApp trap
            if (!isNetAppTrap()) {
                return;
            }
            
            // Parse trap OID and get trap information
            var trapOID = getTrapOID();
            var trapInfo = getTrapInfo(trapOID);
            
            // Set basic event fields
            event.source = getSourceNode();
            event.node = getSourceNode();
            event.type = 'NetApp Storage Alert';
            event.resource = getResource();
            
            // Set severity and description
            setSeverityAndDescription(trapInfo, trapOID);
            
            // Set assignment group
            event.assignment_group = 'Storage-FTS';
            
            // Set additional fields
            setAdditionalFields(trapInfo);
            
            // Parse and add custom fields from varbinds
            parseVarbinds();
            
            // Set correlation information
            setCorrelationInfo();
            
        } catch (error) {
            gs.log('Error processing NetApp SNMP trap: ' + error.toString(), 'NetApp Trap Handler');
        }
    }
    
    /**
     * Check if this is a NetApp SNMP trap
     */
    function isNetAppTrap() {
        var trapOID = getTrapOID();
        return trapOID && trapOID.indexOf(NETAPP_ENTERPRISE_OID) === 0;
    }
    
    /**
     * Get the trap OID from varbinds
     */
    function getTrapOID() {
        var varbinds = event.additional_info || '';
        var trapOIDMatch = varbinds.match(new RegExp(standardOIDs.snmpTrapOID + '\\s*=\\s*([\\d\\.]+)'));
        return trapOIDMatch ? trapOIDMatch[1] : null;
    }
    
    /**
     * Get trap information from mapping table
     */
    function getTrapInfo(trapOID) {
        return trapSeverityMap[trapOID] || {
            severity: 3,
            name: 'Unknown NetApp Trap',
            category: 'General'
        };
    }
    
    /**
     * Get source node from varbinds
     */
    function getSourceNode() {
        var varbinds = event.additional_info || '';
        var sysNameMatch = varbinds.match(new RegExp(standardOIDs.sysName + '\\s*=\\s*([^\\r\\n]+)'));
        return sysNameMatch ? sysNameMatch[1].trim() : event.source || 'Unknown NetApp System';
    }
    
    /**
     * Get resource information
     */
    function getResource() {
        var varbinds = event.additional_info || '';
        var productModelMatch = varbinds.match(new RegExp(netappOIDs.productModel + '\\s*=\\s*([^\\r\\n]+)'));
        return productModelMatch ? productModelMatch[1].trim() : 'NetApp Storage System';
    }
    
    /**
     * Set severity and description based on trap information
     */
    function setSeverityAndDescription(trapInfo, trapOID) {
        // Set severity (1=Critical, 2=Major, 3=Minor, 4=Warning, 5=Info)
        event.severity = trapInfo.severity;
        
        // Set description with trap OID for reference
        var description = trapInfo.name + ' (Trap OID: ' + trapOID + ')';
        
        // Add additional trap data if available
        var varbinds = event.additional_info || '';
        var trapDataMatch = varbinds.match(new RegExp(netappOIDs.productTrapData + '\\s*=\\s*([^\\r\\n]+)'));
        if (trapDataMatch) {
            description += '\nAdditional Info: ' + trapDataMatch[1].trim();
        }
        
        // Special handling for maxdir size events
        if (trapOID === '1.3.6.1.4.1.789.0.187' || trapOID === '1.3.6.1.4.1.789.0.482' || trapOID === '1.3.6.1.4.1.789.0.485') {
            description += parseMaxdirEventDetails(varbinds, trapOID);
        }
        
        event.description = description;
        event.short_description = trapInfo.name + ' on ' + getSourceNode();
    }
    
    /**
     * Parse maxdir size event details from varbinds
     */
    function parseMaxdirEventDetails(varbinds, trapOID) {
        var details = '';
        
        // Common patterns for maxdir event varbinds
        var volumePathPattern = /volume[\s=:]+([^\r\n\s]+)/i;
        var fileCountPattern = /(?:file[s]?[\s=:]+|count[\s=:]+)(\d+)/i;
        var limitPattern = /(?:limit[\s=:]+|max[\s=:]+)(\d+)/i;
        var percentagePattern = /(\d+)%/;
        
        try {
            // Extract volume/directory path
            var volumeMatch = varbinds.match(volumePathPattern);
            if (volumeMatch) {
                details += '\nVolume/Path: ' + volumeMatch[1];
            }
            
            // Extract current file count
            var fileCountMatch = varbinds.match(fileCountPattern);
            if (fileCountMatch) {
                details += '\nCurrent Files: ' + fileCountMatch[1];
            }
            
            // Extract limit information
            var limitMatch = varbinds.match(limitPattern);
            if (limitMatch) {
                details += '\nMaximum Limit: ' + limitMatch[1];
                
                // Calculate percentage if both values available
                if (fileCountMatch && limitMatch) {
                    var percentage = Math.round((parseInt(fileCountMatch[1]) / parseInt(limitMatch[1])) * 100);
                    details += '\nUsage: ' + percentage + '%';
                }
            }
            
            // Extract percentage if directly mentioned
            var percentMatch = varbinds.match(percentagePattern);
            if (percentMatch && !limitMatch) {
                details += '\nUsage: ' + percentMatch[0];
            }
            
            // Add specific recommendations based on trap type
            if (trapOID === '1.3.6.1.4.1.789.0.485') {
                details += '\nRecommendation: Monitor directory growth and plan restructuring';
            } else if (trapOID === '1.3.6.1.4.1.789.0.482') {
                details += '\nAction Required: Critical directory size limit - immediate intervention needed';
            } else if (trapOID === '1.3.6.1.4.1.789.0.187') {
                details += '\nAction Required: WAFL directory is full - cannot create new files';
            }
            
        } catch (error) {
            gs.log('Error parsing maxdir event details: ' + error.toString(), 'NetApp Maxdir Parser');
        }
        
        return details;
    }
    
    /**
     * Set additional event fields
     */
    function setAdditionalFields(trapInfo) {
        event.category = trapInfo.category;
        event.subcategory = 'NetApp CDOT 9.14';
        event.u_vendor = 'NetApp';
        event.priority = mapSeverityToPriority(trapInfo.severity);
        
        // Set impact and urgency based on severity
        switch (trapInfo.severity) {
            case 1: // Critical
                event.impact = 1;
                event.urgency = 1;
                break;
            case 2: // Major
                event.impact = 2;
                event.urgency = 2;
                break;
            case 3: // Minor
                event.impact = 3;
                event.urgency = 3;
                break;
            default: // Warning/Info
                event.impact = 4;
                event.urgency = 4;
        }
    }
    
    /**
     * Map severity to priority
     */
    function mapSeverityToPriority(severity) {
        switch (severity) {
            case 1: return 1; // Critical -> Critical
            case 2: return 2; // Major -> High
            case 3: return 3; // Minor -> Moderate
            default: return 4; // Warning -> Low
        }
    }
    
    /**
     * Parse varbinds and extract useful information
     */
    function parseVarbinds() {
        var varbinds = event.additional_info || '';
        
        // Extract system information
        var serialMatch = varbinds.match(new RegExp(netappOIDs.productSerialNum + '\\s*=\\s*([^\\r\\n]+)'));
        if (serialMatch) {
            event.u_serial_number = serialMatch[1].trim();
        }
        
        var versionMatch = varbinds.match(new RegExp(netappOIDs.productVersion + '\\s*=\\s*([^\\r\\n]+)'));
        if (versionMatch) {
            event.u_ontap_version = versionMatch[1].trim();
        }
        
        // Extract uptime
        var uptimeMatch = varbinds.match(new RegExp(standardOIDs.sysUpTime + '\\s*=\\s*([^\\r\\n]+)'));
        if (uptimeMatch) {
            event.u_system_uptime = uptimeMatch[1].trim();
        }
        
        // Extract maxdir-specific information if this is a maxdir event
        var trapOID = getTrapOID();
        if (trapOID === '1.3.6.1.4.1.789.0.187' || trapOID === '1.3.6.1.4.1.789.0.482' || trapOID === '1.3.6.1.4.1.789.0.485') {
            parseMaxdirFields(varbinds);
        }
        
        // Store complete varbind information for troubleshooting
        event.u_snmp_varbinds = varbinds;
    }
    
    /**
     * Parse maxdir-specific fields from varbinds
     */
    function parseMaxdirFields(varbinds) {
        try {
            // Extract volume/directory path
            var volumePathPattern = /volume[\s=:]+([^\r\n\s]+)/i;
            var volumeMatch = varbinds.match(volumePathPattern);
            if (volumeMatch) {
                event.u_affected_volume = volumeMatch[1].trim();
            }
            
            // Extract current file count
            var fileCountPattern = /(?:file[s]?[\s=:]+|count[\s=:]+)(\d+)/i;
            var fileCountMatch = varbinds.match(fileCountPattern);
            if (fileCountMatch) {
                event.u_current_file_count = fileCountMatch[1];
            }
            
            // Extract maximum limit
            var limitPattern = /(?:limit[\s=:]+|max[\s=:]+)(\d+)/i;
            var limitMatch = varbinds.match(limitPattern);
            if (limitMatch) {
                event.u_maxdir_limit = limitMatch[1];
            }
            
            // Calculate and store usage percentage
            if (fileCountMatch && limitMatch) {
                var percentage = Math.round((parseInt(fileCountMatch[1]) / parseInt(limitMatch[1])) * 100);
                event.u_usage_percentage = percentage.toString();
            }
            
            // Set capacity threshold status
            var trapOID = getTrapOID();
            if (trapOID === '1.3.6.1.4.1.789.0.485') {
                event.u_threshold_status = 'Warning - Directory Size Warning';
            } else if (trapOID === '1.3.6.1.4.1.789.0.482') {
                event.u_threshold_status = 'Critical - Directory Size Alert';
            } else if (trapOID === '1.3.6.1.4.1.789.0.187') {
                event.u_threshold_status = 'Critical - WAFL Directory Full';
            }
            
        } catch (error) {
            gs.log('Error parsing maxdir fields: ' + error.toString(), 'NetApp Maxdir Field Parser');
        }
    }
    
    /**
     * Set correlation information for event grouping
     */
    function setCorrelationInfo() {
        var sourceNode = getSourceNode();
        event.correlation_id = 'NetApp_' + sourceNode + '_' + event.category;
        event.message_key = sourceNode + '_NetApp_Storage';
    }
    
    /**
     * Add custom formatting for work notes
     */
    function addWorkNotes() {
        var workNote = 'NetApp SNMP Trap Processed:\n';
        workNote += '- Source: ' + event.source + '\n';
        workNote += '- Severity: ' + getSeverityText(event.severity) + '\n';
        workNote += '- Category: ' + event.category + '\n';
        
        if (event.u_serial_number) {
            workNote += '- Serial Number: ' + event.u_serial_number + '\n';
        }
        
        if (event.u_ontap_version) {
            workNote += '- ONTAP Version: ' + event.u_ontap_version + '\n';
        }
        
        // Add maxdir-specific information if available
        if (event.u_affected_volume) {
            workNote += '- Affected Volume: ' + event.u_affected_volume + '\n';
        }
        
        if (event.u_current_file_count && event.u_maxdir_limit) {
            workNote += '- File Count: ' + event.u_current_file_count + ' / ' + event.u_maxdir_limit;
            if (event.u_usage_percentage) {
                workNote += ' (' + event.u_usage_percentage + '%)\n';
            } else {
                workNote += '\n';
            }
        }
        
        if (event.u_threshold_status) {
            workNote += '- Status: ' + event.u_threshold_status + '\n';
        }
        
        event.work_notes = workNote;
    }
    
    /**
     * Convert severity number to text
     */
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
    processNetAppTrap();
    addWorkNotes();
    
})();