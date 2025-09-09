// ServiceNow ITOM Event Field Mapping - Dell/EMC Storage SNMP Traps
// Enterprise OID: 1.3.6.1.4.1.1139 (EMC Corporation - now Dell Technologies)
// This script handles SNMP traps from Dell/EMC storage systems (PowerStore, Unity, ECS)

(function() {
    
    // Dell/EMC Enterprise OID prefixes
    var EMC_ENTERPRISE_OID = '1.3.6.1.4.1.1139';
    var EMC_POWERSTORE_OID = '1.3.6.1.4.1.1139.205'; // PowerStore specific
    var EMC_UNITY_OID = '1.3.6.1.4.1.1139.103'; // Unity specific
    var EMC_ECS_OID = '1.3.6.1.4.1.1139.300'; // ECS specific
    
    // Trap OID to severity and category mapping - Based on actual PowerStore MIB
    var trapInfoMap = {
        // PowerStore traps - Actual MIB OIDs from PowerStore-MIB
        '1.3.6.1.4.1.1139.205.1.2.1': { severity: 1, name: 'PowerStore Critical Alert', category: 'Storage', component: 'Array', system: 'PowerStore' }, // powerstoreGenericTrapCritical
        '1.3.6.1.4.1.1139.205.1.2.2': { severity: 2, name: 'PowerStore Major Alert', category: 'Storage', component: 'Array', system: 'PowerStore' }, // powerstoreGenericTrapMajor
        '1.3.6.1.4.1.1139.205.1.2.3': { severity: 3, name: 'PowerStore Minor Alert', category: 'Storage', component: 'Array', system: 'PowerStore' }, // powerstoreGenericTrapMinor
        '1.3.6.1.4.1.1139.205.1.2.4': { severity: 4, name: 'PowerStore Warning Alert', category: 'Storage', component: 'Array', system: 'PowerStore' }, // powerstoreGenericTrapWarning
        '1.3.6.1.4.1.1139.205.1.2.5': { severity: 5, name: 'PowerStore Info Alert', category: 'Storage', component: 'Array', system: 'PowerStore' }, // powerstoreGenericTrapInfo
        
        // Unity traps
        '1.3.6.1.4.1.1139.103.1.1.1': { severity: 1, name: 'Unity Critical Alert', category: 'Storage', component: 'Array', system: 'Unity' },
        '1.3.6.1.4.1.1139.103.1.1.2': { severity: 2, name: 'Unity Major Alert', category: 'Storage', component: 'Array', system: 'Unity' },
        '1.3.6.1.4.1.1139.103.1.1.3': { severity: 3, name: 'Unity Minor Alert', category: 'Storage', component: 'Array', system: 'Unity' },
        
        // ECS traps
        '1.3.6.1.4.1.1139.300.1.1.1': { severity: 1, name: 'ECS Critical Alert', category: 'Storage', component: 'ObjectStore', system: 'ECS' },
        '1.3.6.1.4.1.1139.300.1.1.2': { severity: 2, name: 'ECS Major Alert', category: 'Storage', component: 'ObjectStore', system: 'ECS' }
    };
    
    // Standard SNMP OIDs
    var standardOIDs = {
        sysUpTime: '1.3.6.1.2.1.1.3.0',
        snmpTrapOID: '1.3.6.1.6.3.1.1.4.1.0',
        sysName: '1.3.6.1.2.1.1.5.0'
    };
    
    // Dell/EMC storage-specific OIDs
    var emcStorageOIDs = {
        // PowerStore MIB OIDs - varbind 13 contains node information
        // Based on actual PowerStore-MIB structure
        powerstoreTrapDescription: '1.3.6.1.4.1.1139.205.1.1.2', // powerstoreTrapDescription object
        powerstoreTrapResourceName: '1.3.6.1.4.1.1139.205.1.1.1', // powerstoreTrapResourceName object - Used for resource field
        powerstoreTrapTimestamp: '1.3.6.1.4.1.1139.205.1.1.3', // powerstoreTrapTimestamp object
        powerstoreTrapSeverity: '1.3.6.1.4.1.1139.205.1.1.4', // powerstoreTrapSeverity object
        powerstoreTrapState: '1.3.6.1.4.1.1139.205.1.1.5', // powerstoreTrapState object
        
        // Unity and ECS theoretical OIDs (for future implementation)
        unityTrapDescription: '1.3.6.1.4.1.1139.103.1.1.2',
        ecsTrapDescription: '1.3.6.1.4.1.1139.300.1.1.2'
    };
    
    /**
     * ServiceNow Event Field Mapping Script for Dell/EMC Storage Systems
     * Official ServiceNow ITOM Event Field Mapping function
     * 
     * @param {GlideRecord} eventGr - The event GlideRecord (temporary object)
     * @param {string} origEventSysId - Original event sys_id
     * @param {string} fieldMappingRuleName - Name of the field mapping rule
     * @returns {boolean} - true if successful, false if failed
     */
    function eventFieldMappingScript(eventGr, origEventSysId, fieldMappingRuleName) {
        try {
            // Make any changes to the alert which will be created out of this Event
            // Note that the Event itself is immutable, and will not be changed in the database.
            // You can set the values on the eventGr, e.g. eventGr.setValue(...), but don't perform an update with eventGr.update().
            // To abort the changes in the event record, return false;
            // Returning a value other than boolean will result in an error
            
            var source = eventGr.getValue('source') || eventGr.getValue('node') || 'unknown';
            var category = eventGr.getValue('category') || 'Storage';
            var additionalInfo = eventGr.getValue('additional_info') || '';
            
            // Determine Dell/EMC storage system type from trap OID
            var systemType = determineStorageSystemType(additionalInfo);
            
            // Dell/EMC Storage assignment logic - all storage events go to storage-fts
            var assignmentGroup = 'storage-fts';
            
            // Set assignment group
            if (assignmentGroup) {
                eventGr.setValue('assignment_group', assignmentGroup);
            }
            
            // Set standardized fields for Dell/EMC storage events
            if (!eventGr.getValue('u_vendor')) {
                eventGr.setValue('u_vendor', 'Dell/EMC');
            }
            
            if (!eventGr.getValue('type')) {
                eventGr.setValue('type', 'Dell ' + systemType + ' Storage Alert');
            }
            
            // Set category and subcategory
            if (!eventGr.getValue('category')) {
                eventGr.setValue('category', 'Storage');
            }
            
            if (!eventGr.getValue('subcategory')) {
                eventGr.setValue('subcategory', 'Dell ' + systemType);
            }
            
            // Set component type based on system
            if (!eventGr.getValue('u_component_type')) {
                var componentType = getComponentType(systemType);
                eventGr.setValue('u_component_type', componentType);
            }
            
            return true;
        } catch (e) {
            gs.error("The script type mapping rule '" + fieldMappingRuleName + "' ran with the error: \\n" + e);
            return false;
        }
    }
    
    /**
     * Determine storage system type from trap OID in additional_info
     */
    function determineStorageSystemType(additionalInfo) {
        if (additionalInfo.indexOf(EMC_POWERSTORE_OID) >= 0) {
            return 'PowerStore';
        } else if (additionalInfo.indexOf(EMC_UNITY_OID) >= 0) {
            return 'Unity';
        } else if (additionalInfo.indexOf(EMC_ECS_OID) >= 0) {
            return 'ECS';
        } else if (additionalInfo.indexOf(EMC_ENTERPRISE_OID) >= 0) {
            return 'EMC Storage';
        }
        return 'Dell/EMC Storage';
    }
    
    /**
     * Get component type based on storage system
     */
    function getComponentType(systemType) {
        switch (systemType) {
            case 'PowerStore':
                return 'Array';
            case 'Unity':
                return 'Array';
            case 'ECS':
                return 'ObjectStore';
            default:
                return 'Storage';
        }
    }
    
    /**
     * Main function to process Dell/EMC Storage SNMP trap
     */
    function processDellEMCStorageTrap() {
        try {
            if (!isDellEMCStorageTrap()) return;
            
            var trapOID = getTrapOID();
            var trapInfo = getTrapInfo(trapOID);
            var sourceNode = getSourceNode();
            
            // Set basic event fields
            event.source = sourceNode;
            event.node = sourceNode;
            event.type = 'Dell ' + trapInfo.system + ' Storage Alert';
            event.resource = getResource(trapInfo);
            
            setSeverityAndDescription(trapInfo, trapOID);
            setAssignmentGroup(trapInfo);
            setAdditionalFields(trapInfo);
            parseVarbinds(trapInfo);
            setCorrelationInfo(trapInfo);
            
        } catch (error) {
            gs.log('Error processing Dell/EMC Storage SNMP trap: ' + error.toString(), 'Dell EMC Storage Trap Handler');
        }
    }
    
    function isDellEMCStorageTrap() {
        var trapOID = getTrapOID();
        return trapOID && trapOID.indexOf(EMC_ENTERPRISE_OID) === 0;
    }
    
    function getTrapOID() {
        var varbinds = event.additional_info || '';
        var trapOIDMatch = varbinds.match(new RegExp(standardOIDs.snmpTrapOID + '\\s*=\\s*([\\d\\.]+)'));
        return trapOIDMatch ? trapOIDMatch[1] : null;
    }
    
    function getTrapInfo(trapOID) {
        return trapInfoMap[trapOID] || {
            severity: 3,
            name: 'Unknown Dell/EMC Storage Trap',
            category: 'Storage',
            component: 'Unknown',
            system: 'Dell/EMC Storage'
        };
    }
    
    function getSourceNode() {
        var varbinds = event.additional_info || '';
        
        // First priority: Check varbind 13 for node information
        var varbind13Match = varbinds.match(/(?:^|\n)\s*13\s*=\s*([^\r\n]+)/i);
        if (varbind13Match) {
            return cleanHostname(varbind13Match[1].trim());
        }
        
        // Fallback: Use sysName from standard SNMP OIDs
        var sysNameMatch = varbinds.match(new RegExp(standardOIDs.sysName + '\\s*=\\s*([^\\r\\n]+)'));
        if (sysNameMatch) {
            return cleanHostname(sysNameMatch[1].trim());
        }
        
        // Final fallback: Use event source
        var hostname = event.source || 'Unknown Dell/EMC Storage System';
        return cleanHostname(hostname);
    }
    
    function cleanHostname(hostname) {
        if (!hostname) return hostname;
        
        var cleanedName = hostname.toString().trim();
        var suffixPatterns = [/-powerstore$/i, /-unity$/i, /-ecs$/i, /-storage$/i, /-mgmt$/i, /-san$/i];
        
        for (var i = 0; i < suffixPatterns.length; i++) {
            if (suffixPatterns[i].test(cleanedName)) {
                cleanedName = cleanedName.replace(suffixPatterns[i], '');
                break;
            }
        }
        
        cleanedName = cleanedName.replace(/[-\\.]+$/, '');
        return cleanedName.length === 0 ? hostname : cleanedName;
    }
    
    function getResource(trapInfo) {
        var varbinds = event.additional_info || '';
        
        // First priority: Use powerstoreTrapResourceName from varbinds
        var resourceNameMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapResourceName + '\s*=\s*([^\r\n]+)'));
        if (resourceNameMatch) {
            return resourceNameMatch[1].trim();
        }
        
        // Try other system-specific resource names based on system type
        switch (trapInfo.system) {
            case 'Unity':
                var unityResourceMatch = varbinds.match(/(?:^|\n)\s*unityTrapResourceName\s*=\s*([^\r\n]+)/i);
                if (unityResourceMatch) {
                    return unityResourceMatch[1].trim();
                }
                break;
            case 'ECS':
                var ecsResourceMatch = varbinds.match(/(?:^|\n)\s*ecsTrapResourceName\s*=\s*([^\r\n]+)/i);
                if (ecsResourceMatch) {
                    return ecsResourceMatch[1].trim();
                }
                break;
        }
        
        // Fallback to system name
        return 'Dell ' + trapInfo.system;
    }
    
    /**
     * Extract PowerStore trap severity from MIB objects
     */
    function getPowerStoreTrapSeverity(varbinds, trapOID) {
        // First try to get severity from powerstoreTrapSeverity object
        var severityMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapSeverity + '\\s*=\\s*([^\\r\\n]+)'));
        if (severityMatch) {
            var severityText = severityMatch[1].trim().toLowerCase();
            
            // Map PowerStore severity text to ServiceNow severity levels
            switch (severityText) {
                case 'critical':
                    return 1;
                case 'major':
                    return 2;
                case 'minor':
                    return 3;
                case 'warning':
                    return 4;
                case 'info':
                case 'informational':
                    return 5;
                default:
                    // Try to parse numeric severity
                    var numericSeverity = parseInt(severityText);
                    if (!isNaN(numericSeverity) && numericSeverity >= 1 && numericSeverity <= 5) {
                        return numericSeverity;
                    }
            }
        }
        
        // Fallback: Determine severity from trap OID (powerstoreGenericTrap hierarchy)
        if (trapOID === '1.3.6.1.4.1.1139.205.1.2.1') return 1; // powerstoreGenericTrapCritical
        if (trapOID === '1.3.6.1.4.1.1139.205.1.2.2') return 2; // powerstoreGenericTrapMajor
        if (trapOID === '1.3.6.1.4.1.1139.205.1.2.3') return 3; // powerstoreGenericTrapMinor
        if (trapOID === '1.3.6.1.4.1.1139.205.1.2.4') return 4; // powerstoreGenericTrapWarning
        if (trapOID === '1.3.6.1.4.1.1139.205.1.2.5') return 5; // powerstoreGenericTrapInfo
        
        // Default fallback
        return 3; // Minor
    }
    
    function setSeverityAndDescription(trapInfo, trapOID) {
        var varbinds = event.additional_info || '';
        
        // For PowerStore, use MIB-based severity determination
        if (trapInfo.system === 'PowerStore') {
            event.severity = getPowerStoreTrapSeverity(varbinds, trapOID);
        } else {
            // For other systems, use trapInfo severity
            event.severity = trapInfo.severity;
        }
        
        var severityText = getSeverityText(event.severity).toUpperCase();
        
        // Use powerstoreTrapDescription for PowerStore systems
        var description = '';
        if (trapInfo.system === 'PowerStore') {
            var descMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapDescription + '\\s*=\\s*([^\\r\\n]+)'));
            if (descMatch) {
                description = '[' + severityText + '] ' + descMatch[1].trim() + ' (Trap OID: ' + trapOID + ')';
            } else {
                // Fallback if powerstoreTrapDescription not found
                description = '[' + severityText + '] ' + trapInfo.name + ' (Trap OID: ' + trapOID + ')';
            }
        } else {
            // For other systems, use trap name
            description = '[' + severityText + '] ' + trapInfo.name + ' (Trap OID: ' + trapOID + ')';
        }
        
        event.description = description;
        event.short_description = (trapInfo.system === 'PowerStore' && descMatch) ? 
                                 descMatch[1].trim() + ' on ' + getSourceNode() : 
                                 trapInfo.name + ' on ' + getSourceNode();
    }
    
    function setAssignmentGroup(trapInfo) {
        var eventMappingSuccess = eventFieldMappingScript(event, event.sys_id, 'Dell EMC Storage Assignment');
        
        if (!eventMappingSuccess) {
            // Fallback assignment for all Dell/EMC storage events
            event.assignment_group = 'storage-fts';
        }
    }
    
    function setAdditionalFields(trapInfo) {
        event.category = trapInfo.category;
        event.subcategory = 'Dell ' + trapInfo.system;
        event.u_vendor = 'Dell/EMC';
        event.u_component_type = trapInfo.component;
        event.priority = mapSeverityToPriority(event.severity);
    }
    
    function mapSeverityToPriority(severity) {
        switch (severity) {
            case 1: return 1; // Critical
            case 2: return 2; // Major
            case 3: return 3; // Minor
            case 4: return 4; // Warning
            default: return 5; // Info
        }
    }
    
    function parseVarbinds(trapInfo) {
        var varbinds = event.additional_info || '';
        
        // For PowerStore systems, extract MIB-specific objects
        if (trapInfo.system === 'PowerStore') {
            // Extract powerstoreTrapDescription
            var descMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapDescription + '\\s*=\\s*([^\\r\\n]+)'));
            if (descMatch) {
                event.u_trap_description = descMatch[1].trim();
            }
            
            // Extract powerstoreTrapResourceName
            var resourceMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapResourceName + '\\s*=\\s*([^\\r\\n]+)'));
            if (resourceMatch) {
                event.u_powerstore_resource = resourceMatch[1].trim();
            }
            
            // Extract powerstoreTrapTimestamp
            var timestampMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapTimestamp + '\\s*=\\s*([^\\r\\n]+)'));
            if (timestampMatch) {
                event.u_powerstore_timestamp = timestampMatch[1].trim();
            }
            
            // Extract powerstoreTrapSeverity
            var severityMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapSeverity + '\\s*=\\s*([^\\r\\n]+)'));
            if (severityMatch) {
                event.u_powerstore_severity = severityMatch[1].trim();
            }
            
            // Extract powerstoreTrapState
            var stateMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapState + '\\s*=\\s*([^\\r\\n]+)'));
            if (stateMatch) {
                event.u_powerstore_state = stateMatch[1].trim();
            }
        } else {
            // For other systems, use generic trap description extraction
            var descPattern = getDescriptionOID(trapInfo.system);
            if (descPattern) {
                var descMatch = varbinds.match(new RegExp(descPattern + '\\s*=\\s*([^\\r\\n]+)'));
                if (descMatch) {
                    event.u_trap_description = descMatch[1].trim();
                }
            }
        }
        
        // Store complete varbind information
        event.u_snmp_varbinds = varbinds;
    }
    
    function getDescriptionOID(systemType) {
        switch (systemType) {
            case 'PowerStore': return emcStorageOIDs.powerstoreTrapDescription;
            case 'Unity': return emcStorageOIDs.unityTrapDescription;
            case 'ECS': return emcStorageOIDs.ecsTrapDescription;
            default: return null;
        }
    }
    
    function setCorrelationInfo(trapInfo) {
        var sourceNode = getSourceNode();
        event.correlation_id = 'Dell_EMC_' + sourceNode + '_' + trapInfo.component;
        event.message_key = sourceNode + '_DellEMC_' + trapInfo.category;
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
    processDellEMCStorageTrap();
    
})();