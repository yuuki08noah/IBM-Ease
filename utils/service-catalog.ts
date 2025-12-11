export const serviceCategories = [
    {
        name: 'Compute',
        services: [
            { type: 'vpc-vsi', name: 'Virtual Server for VPC', icon: '💻', color: 'var(--ibm-blue-60)' },
            { type: 'classic-vsi', name: 'Classic Virtual Server', icon: '🖥️', color: 'var(--ibm-gray-60)' },
            { type: 'baremetal', name: 'Bare Metal Server', icon: '🏗️', color: 'var(--ibm-gray-70)' },
            { type: 'vmware', name: 'VMware Solutions', icon: '🖥️', color: 'var(--ibm-blue-50)' },
            { type: 'power-vs', name: 'Power Systems Virtual Server', icon: '⚡', color: 'var(--ibm-blue-70)' },
            { type: 'z-linuxone', name: 'LinuxONE', icon: '🐧', color: 'var(--ibm-blue-80)' },
            { type: 'hpc', name: 'High Performance Computing', icon: '🚀', color: 'var(--ibm-blue-60)' },
            { type: 'sap', name: 'SAP on IBM Cloud', icon: '🏢', color: 'var(--ibm-blue-50)' },
            { type: 'quantum', name: 'IBM Quantum', icon: '⚛️', color: 'var(--ibm-purple-80)' },
            { type: 'hyper-protect-vsi', name: 'Hyper Protect Virtual Server', icon: '🛡️', color: 'var(--ibm-green-80)' },
        ]
    },
    {
        name: 'Containers',
        services: [
            { type: 'kubernetes', name: 'Kubernetes Service (IKS)', icon: '☸️', color: 'var(--ibm-blue-60)' },
            { type: 'openshift', name: 'Red Hat OpenShift (ROKS)', icon: '⭕', color: 'var(--ibm-red-60)' },
            { type: 'registry', name: 'Container Registry', icon: '🚢', color: 'var(--ibm-blue-40)' },
            { type: 'code-engine', name: 'Code Engine', icon: '⚙️', color: 'var(--ibm-blue-50)' },
            { type: 'satellite', name: 'IBM Cloud Satellite', icon: '🛰️', color: 'var(--ibm-blue-70)' },
        ]
    },
    {
        name: 'Network',
        services: [
            { type: 'vpc', name: 'VPC', icon: '☁️', color: 'var(--ibm-blue-60)' },
            { type: 'subnet', name: 'VPC Subnet', icon: '🕸️', color: 'var(--ibm-blue-50)' },
            { type: 'gateway', name: 'Public Gateway', icon: '🚪', color: 'var(--ibm-blue-50)' },
            { type: 'vpn', name: 'VPN Gateway', icon: '🔒', color: 'var(--ibm-blue-50)' },
            { type: 'load-balancer', name: 'Load Balancer for VPC', icon: '⚖️', color: 'var(--ibm-blue-40)' },
            { type: 'dns', name: 'DNS Services', icon: '🌐', color: 'var(--ibm-blue-30)' },
            { type: 'transit-gateway', name: 'Transit Gateway', icon: '↔️', color: 'var(--ibm-green-50)' },
            { type: 'direct-link', name: 'Direct Link', icon: '🔗', color: 'var(--ibm-green-60)' },
            { type: 'cis', name: 'Cloud Internet Services (CIS)', icon: '🛡️', color: 'var(--ibm-green-40)' },
            { type: 'cdn', name: 'Content Delivery Network', icon: '🌍', color: 'var(--ibm-blue-30)' },
            { type: 'classic-vlan', name: 'Classic VLAN', icon: '🔌', color: 'var(--ibm-gray-50)' },
            { type: 'classic-gateway', name: 'Gateway Appliance', icon: '🧱', color: 'var(--ibm-gray-60)' },
        ]
    },
    {
        name: 'Storage',
        services: [
            { type: 'cos', name: 'Cloud Object Storage', icon: '📦', color: 'var(--ibm-blue-50)' },
            { type: 'block-storage', name: 'Block Storage (VPC)', icon: '🔲', color: 'var(--ibm-blue-40)' },
            { type: 'file-storage', name: 'File Storage (VPC)', icon: '📁', color: 'var(--ibm-blue-40)' },
            { type: 'classic-block', name: 'Classic Block Storage', icon: '🧊', color: 'var(--ibm-gray-40)' },
            { type: 'classic-file', name: 'Classic File Storage', icon: '📂', color: 'var(--ibm-gray-40)' },
            { type: 'backup', name: 'Cloud Backup', icon: '💾', color: 'var(--ibm-gray-50)' },
            { type: 'mass-data', name: 'Mass Data Migration', icon: '🚚', color: 'var(--ibm-gray-50)' },
        ]
    },
    {
        name: 'Databases',
        services: [
            { type: 'cloudant', name: 'Cloudant', icon: '📄', color: 'var(--ibm-green-60)' },
            { type: 'postgresql', name: 'Databases for PostgreSQL', icon: '🐘', color: 'var(--ibm-green-50)' },
            { type: 'mongodb', name: 'Databases for MongoDB', icon: '🍃', color: 'var(--ibm-green-50)' },
            { type: 'redis', name: 'Databases for Redis', icon: '🔴', color: 'var(--ibm-red-50)' },
            { type: 'elasticsearch', name: 'Databases for Elasticsearch', icon: '🔎', color: 'var(--ibm-yellow-50)' },
            { type: 'etcd', name: 'Databases for etcd', icon: '⚙️', color: 'var(--ibm-blue-40)' },
            { type: 'mysql', name: 'Databases for MySQL', icon: '🐬', color: 'var(--ibm-blue-50)' },
            { type: 'enterprisedb', name: 'EnterpriseDB', icon: '🏢', color: 'var(--ibm-green-70)' },
            { type: 'db2', name: 'Db2', icon: '🗄️', color: 'var(--ibm-blue-70)' },
            { type: 'db2-warehouse', name: 'Db2 Warehouse', icon: '🏪', color: 'var(--ibm-blue-80)' },
            { type: 'datastax', name: 'DataStax (Cassandra)', icon: '👁️', color: 'var(--ibm-blue-40)' },
            { type: 'hyper-protect-dbaas', name: 'Hyper Protect DBaaS', icon: '🛡️', color: 'var(--ibm-green-80)' },
            { type: 'informix', name: 'Informix', icon: 'ℹ️', color: 'var(--ibm-gray-60)' },
            { type: 'event-streams', name: 'Event Streams (Kafka)', icon: '📨', color: 'var(--ibm-purple-50)' },
        ]
    },
    {
        name: 'AI & Machine Learning',
        services: [
            { type: 'watsonx-ai', name: 'watsonx.ai', icon: '🧠', color: 'var(--ibm-purple-70)' },
            { type: 'watsonx-data', name: 'watsonx.data', icon: '📊', color: 'var(--ibm-purple-50)' },
            { type: 'watsonx-gov', name: 'watsonx.governance', icon: '⚖️', color: 'var(--ibm-purple-60)' },
            { type: 'watson-assistant', name: 'Watson Assistant', icon: '🤖', color: 'var(--ibm-purple-60)' },
            { type: 'watson-discovery', name: 'Watson Discovery', icon: '🔍', color: 'var(--ibm-purple-50)' },
            { type: 'watson-orchestrate', name: 'Watson Orchestrate', icon: '🎼', color: 'var(--ibm-purple-60)' },
            { type: 'wml', name: 'Watson Machine Learning', icon: '🔬', color: 'var(--ibm-purple-40)' },
            { type: 'watson-speech', name: 'Watson Speech to Text', icon: '🗣️', color: 'var(--ibm-purple-40)' },
            { type: 'watson-text-speech', name: 'Watson Text to Speech', icon: '🎧', color: 'var(--ibm-purple-40)' },
            { type: 'watson-nlp', name: 'Watson Natural Language', icon: '📝', color: 'var(--ibm-purple-40)' },
            { type: 'data-stage', name: 'DataStage', icon: '🔄', color: 'var(--ibm-blue-50)' },
            { type: 'analytics-engine', name: 'Analytics Engine (Spark)', icon: '⚡', color: 'var(--ibm-blue-60)' },
        ]
    },
    {
        name: 'Automation & Operations',
        services: [
            { type: 'instana', name: 'Instana Observability', icon: '📡', color: 'var(--ibm-teal-60)' },
            { type: 'turbonomic', name: 'Turbonomic', icon: '🏎️', color: 'var(--ibm-green-60)' },
            { type: 'concert', name: 'IBM Concert', icon: '🎭', color: 'var(--ibm-magenta-60)' },
            { type: 'sevone', name: 'SevOne', icon: '📈', color: 'var(--ibm-blue-50)' },
            { type: 'ns1', name: 'NS1 Connect', icon: '🌐', color: 'var(--ibm-purple-50)' },
            { type: 'schematics', name: 'Schematics', icon: '📝', color: 'var(--ibm-blue-50)' },
            { type: 'toolchain', name: 'Toolchain', icon: '⛓️', color: 'var(--ibm-gray-50)' },
            { type: 'ci-cd', name: 'CI/CD Pipeline', icon: '🔄', color: 'var(--ibm-green-50)' },
            { type: 'cli', name: 'IBM Cloud CLI', icon: '💻', color: 'var(--ibm-gray-80)' },
        ]
    },
    {
        name: 'Integration',
        services: [
            { type: 'mq', name: 'IBM MQ', icon: '📨', color: 'var(--ibm-blue-70)' },
            { type: 'api-connect', name: 'API Connect', icon: '🔗', color: 'var(--ibm-purple-60)' },
            { type: 'app-connect', name: 'App Connect', icon: '⚡', color: 'var(--ibm-purple-40)' },
            { type: 'aspera', name: 'Aspera', icon: '🚀', color: 'var(--ibm-red-50)' },
            { type: 'event-notifications', name: 'Event Notifications', icon: '🔔', color: 'var(--ibm-yellow-50)' },
            { type: 'event-streams', name: 'Event Streams', icon: '🌊', color: 'var(--ibm-purple-50)' },
        ]
    },
    {
        name: 'Security',
        services: [
            { type: 'key-protect', name: 'Key Protect', icon: '🔑', color: 'var(--ibm-gray-60)' },
            { type: 'secrets-manager', name: 'Secrets Manager', icon: '🤐', color: 'var(--ibm-gray-60)' },
            { type: 'appid', name: 'App ID', icon: '🆔', color: 'var(--ibm-blue-50)' },
            { type: 'hpcs', name: 'Hyper Protect Crypto', icon: '🛡️', color: 'var(--ibm-green-80)' },
            { type: 'scc', name: 'Security & Compliance', icon: '📋', color: 'var(--ibm-blue-50)' },
            { type: 'iam', name: 'IAM', icon: '👤', color: 'var(--ibm-blue-60)' },
            { type: 'activity-tracker', name: 'Activity Tracker', icon: '📊', color: 'var(--ibm-cyan-50)' },
        ]
    },
    {
        name: 'Partner & Third Party',
        services: [
            { type: 'hashicorp-vault', name: 'HashiCorp Vault', icon: '🔐', color: 'var(--ibm-gray-70)' },
            { type: 'hashicorp-terraform', name: 'Terraform Cloud', icon: '💠', color: 'var(--ibm-purple-40)' },
            { type: 'hashicorp-consul', name: 'Consul', icon: '🧭', color: 'var(--ibm-magenta-50)' },
            { type: 'hashicorp-nomad', name: 'Nomad', icon: '📦', color: 'var(--ibm-green-50)' },
            { type: 'sysdig', name: 'Sysdig Secure', icon: '🔦', color: 'var(--ibm-blue-50)' },
            { type: 'veeam', name: 'Veeam', icon: '💾', color: 'var(--ibm-green-60)' },
            { type: 'zerto', name: 'Zerto', icon: '🔴', color: 'var(--ibm-red-60)' },
            { type: 'f5', name: 'F5 BIG-IP', icon: '🔴', color: 'var(--ibm-red-50)' },
            { type: 'fortinet', name: 'Fortinet', icon: '🏰', color: 'var(--ibm-red-60)' },
        ]
    },
    {
        name: 'Kubernetes Resources',
        services: [
            { type: 'k8s-pod', name: 'Pod', icon: '📦', color: 'var(--ibm-magenta-50)' },
            { type: 'k8s-deployment', name: 'Deployment', icon: '🔄', color: 'var(--ibm-magenta-60)' },
            { type: 'k8s-service', name: 'Service', icon: '🔌', color: 'var(--ibm-magenta-40)' },
            { type: 'k8s-ingress', name: 'Ingress', icon: '🚪', color: 'var(--ibm-magenta-50)' },
            { type: 'k8s-configmap', name: 'ConfigMap', icon: '📝', color: 'var(--ibm-teal-50)' },
            { type: 'k8s-secret', name: 'Secret', icon: '🔐', color: 'var(--ibm-teal-60)' },
            { type: 'k8s-pvc', name: 'PVC', icon: '💾', color: 'var(--ibm-cyan-50)' },
            { type: 'k8s-cronjob', name: 'CronJob', icon: '⏱️', color: 'var(--ibm-purple-50)' },
            { type: 'k8s-node', name: 'Node', icon: '🖥️', color: 'var(--ibm-blue-40)' },
        ]
    }
]
