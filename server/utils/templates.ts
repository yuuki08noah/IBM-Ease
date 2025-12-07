export type QuickstartTemplate = {
  id: string
  name: string
  description: string
  services: string[]
  estCost: string
  category: string
  moduleSource: string
  moduleVersion?: string
  variables: Record<string, string>
}

export const quickstartTemplates: QuickstartTemplate[] = [
  {
    id: 'ai-chatbot',
    name: 'AI Chatbot + Cloudant',
    description: 'Serverless chatbot backend with Watson Assistant and Cloudant for session state.',
    services: ['Watson Assistant', 'Cloudant', 'Functions'],
    estCost: '$$ (dev tier)',
    category: 'AI',
    moduleSource: 'github.com/ibm-cloud/chatbot-module', // replace with approved registry module
    variables: {
      region: 'us-south',
      resource_group: 'default'
    }
  },
  {
    id: 'iot-backend',
    name: 'IoT Ingestion Backend',
    description: 'Event Streams + Functions + Object Storage for ingest and store.',
    services: ['Event Streams', 'Functions', 'Object Storage'],
    estCost: '$$ (dev tier)',
    category: 'IoT',
    moduleSource: 'github.com/ibm-cloud/iot-backend-module', // replace with approved registry module
    variables: {
      region: 'us-south',
      resource_group: 'default'
    }
  },
  {
    id: 'react-cloudant',
    name: 'React + Cloudant Fullstack',
    description: 'Static hosting + API + Cloudant starter.',
    services: ['COS static', 'Cloudant', 'API Gateway'],
    estCost: '$ (dev tier)',
    category: 'Web',
    moduleSource: 'github.com/ibm-cloud/react-cloudant-module', // replace with approved registry module
    variables: {
      region: 'us-south',
      resource_group: 'default'
    }
  }
]
