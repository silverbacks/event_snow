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
    
    /**
     * Set assignment group using eventFieldMappingScript and Dynamic CI Grouping
     */
    function setAssignmentGroup(trapInfo) {
        // First priority: EventFieldMappingScript for standardized assignment
        var eventMappingSuccess = eventFieldMappingScript(event, event.sys_id, 'Dell PowerStore Assignment');
        
        if (!eventMappingSuccess) {
            // Second priority: Dynamic CI Grouping based on source node
            var dynamicGroup = getDynamicAssignmentGroup(event.node, trapInfo);
            
            if (dynamicGroup) {
                event.assignment_group = dynamicGroup;
            } else {
                // Fallback to component-based assignment if all methods fail
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
        }
    }
    
    /**
     * ServiceNow Event Field Mapping Script for Dell PowerStore
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
            
            // Dell PowerStore assignment logic based on component type
            var assignmentGroup = null;
            switch (category.toLowerCase()) {
                case 'storage':
                case 'capacity':
                case 'replication':
                case 'protection':
                    assignmentGroup = 'Storage-Support';
                    break;
                case 'network':
                    assignmentGroup = 'Network-Support';
                    break;
                case 'performance':
                    assignmentGroup = 'Storage-Performance';
                    break;
                case 'security':
                case 'management':
                    assignmentGroup = 'Storage-Management';
                    break;
                default:
                    assignmentGroup = 'Storage-Support';
            }
            
            if (assignmentGroup) {
                eventGr.setValue('assignment_group', assignmentGroup);
            }
            
            // Set additional standardized fields for Dell PowerStore events
            if (!eventGr.getValue('u_vendor')) {
                eventGr.setValue('u_vendor', 'Dell');
            }
            
            if (!eventGr.getValue('type')) {
                eventGr.setValue('type', 'Dell PowerStore Storage Alert');
            }
            
            return true;
        } catch (e) {
            gs.error("The script type mapping rule '" + fieldMappingRuleName + "' ran with the error: \n" + e);
            return false;
        }
    }
    
    /**
     * Get Dynamic Assignment Group based on CI and component type for PowerStore
     */
    function getDynamicAssignmentGroup(nodeName, trapInfo) {
        try {
            // Query CMDB to find the PowerStore CI
            var ciGR = new GlideRecord('cmdb_ci_storage_server');
            ciGR.addQuery('name', nodeName);
            ciGR.addOrCondition('fqdn', nodeName);
            ciGR.addOrCondition('ip_address', nodeName);
            if (event.u_array_serial) {
                ciGR.addOrCondition('serial_number', event.u_array_serial);
            }
            ciGR.query();
            
            if (ciGR.next()) {
                var ciSysId = ciGR.getValue('sys_id');
                var ciClass = ciGR.getValue('sys_class_name');
                
                // Look for Dynamic CI Grouping rules
                var groupRule = findStorageCIGroupingRule(ciSysId, ciClass, trapInfo);
                if (groupRule) {
                    return groupRule;
                }
                
                // Check for storage-specific assignment groups in relationships
                var relatedGroup = getStorageCIRelatedAssignmentGroup(ciSysId, trapInfo.category);
                if (relatedGroup) {
                    return relatedGroup;
                }
            }
            
            return null;
        } catch (error) {
            gs.log('Error in getDynamicAssignmentGroup: ' + error.toString(), 'PowerStore Dynamic Assignment');
            return null;
        }
    }
    
    /**
     * Find Storage CI Grouping Rule based on CI class and component type
     */
    function findStorageCIGroupingRule(ciSysId, ciClass, trapInfo) {
        // Check for custom storage CI grouping rules table
        var ruleGR = new GlideRecord('u_storage_ci_grouping_rules');
        if (ruleGR.isValid()) {
            ruleGR.addQuery('active', true);
            ruleGR.addQuery('ci_class', ciClass);
            ruleGR.addQuery('component_category', trapInfo.category.toLowerCase());
            ruleGR.addQuery('vendor', 'Dell');
            ruleGR.addQuery('product', 'PowerStore');
            ruleGR.orderBy('order');
            ruleGR.query();
            
            if (ruleGR.next()) {
                return ruleGR.getValue('assignment_group');
            }
        }
        
        // Check for PowerStore-specific grouping based on array serial
        if (event.u_array_serial) {
            var powerstoreGroup = getPowerStoreSerialAssignmentGroup(event.u_array_serial, trapInfo.category);
            if (powerstoreGroup) {
                return powerstoreGroup;
            }
        }
        
        // Check business service relationships for storage arrays
        return getStorageBusinessServiceAssignmentGroup(ciSysId, trapInfo.category);
    }
    
    /**
     * Get assignment group based on PowerStore array serial mapping
     */
    function getPowerStoreSerialAssignmentGroup(arraySerial, category) {
        // Check if there's a custom mapping table for PowerStore arrays
        var arrayGR = new GlideRecord('u_powerstore_array_mapping');
        if (arrayGR.isValid()) {
            arrayGR.addQuery('array_serial', arraySerial);
            arrayGR.addQuery('active', true);
            arrayGR.query();
            
            if (arrayGR.next()) {
                // Return category-specific group or default group
                switch (category.toLowerCase()) {
                    case 'storage':
                    case 'capacity':
                    case 'replication':
                    case 'protection':
                        return arrayGR.getValue('storage_support_group') || arrayGR.getValue('default_support_group');
                    case 'network':
                        return arrayGR.getValue('network_support_group') || arrayGR.getValue('default_support_group');
                    case 'performance':
                        return arrayGR.getValue('performance_support_group') || arrayGR.getValue('default_support_group');
                    case 'management':
                    case 'security':
                        return arrayGR.getValue('management_support_group') || arrayGR.getValue('default_support_group');
                    default:
                        return arrayGR.getValue('default_support_group');
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get assignment group from storage CI relationships
     */
    function getStorageCIRelatedAssignmentGroup(ciSysId, category) {
        // Check if storage array is related to business services or applications
        var relGR = new GlideRecord('cmdb_rel_ci');
        relGR.addQuery('child', ciSysId);
        relGR.addQuery('parent.sys_class_name', 'STARTSWITH', 'cmdb_ci_service');
        relGR.query();
        
        while (relGR.next()) {
            var serviceGR = new GlideRecord('cmdb_ci_service');
            if (serviceGR.get(relGR.getValue('parent'))) {
                var assignmentGroup = getStorageServiceAssignmentGroup(serviceGR, category);
                if (assignmentGroup) {
                    return assignmentGroup;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get assignment group from business service based on storage category
     */
    function getStorageBusinessServiceAssignmentGroup(ciSysId, category) {
        // Look for business service mappings specific to storage
        var bsRelGR = new GlideRecord('cmdb_rel_ci');
        bsRelGR.addQuery('child', ciSysId);
        bsRelGR.addQuery('parent.sys_class_name', 'cmdb_ci_service_discovered');
        bsRelGR.query();
        
        while (bsRelGR.next()) {
            var serviceGR = new GlideRecord('cmdb_ci_service_discovered');
            if (serviceGR.get(bsRelGR.getValue('parent'))) {
                var supportGroup = getStorageServiceCategorySupportGroup(serviceGR, category);
                if (supportGroup) {
                    return supportGroup;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get assignment group from service based on storage component category
     */
    function getStorageServiceAssignmentGroup(serviceGR, category) {
        return getStorageServiceCategorySupportGroup(serviceGR, category);
    }
    
    /**
     * Get category-specific support group from service CI for storage
     */
    function getStorageServiceCategorySupportGroup(serviceGR, category) {
        var supportGroup = null;
        
        switch (category.toLowerCase()) {
            case 'storage':
            case 'capacity':
            case 'replication':
            case 'protection':
                supportGroup = serviceGR.getValue('u_storage_support_group');
                break;
            case 'network':
                supportGroup = serviceGR.getValue('u_network_support_group');
                break;
            case 'performance':
                supportGroup = serviceGR.getValue('u_performance_support_group');
                break;
            case 'management':
            case 'security':
                supportGroup = serviceGR.getValue('u_storage_management_support_group');
                break;
        }
        
        // Fallback to general storage support group
        if (!supportGroup) {
            supportGroup = serviceGR.getValue('u_storage_support_group') || serviceGR.getValue('support_group');
        }
        
        return supportGroup;
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