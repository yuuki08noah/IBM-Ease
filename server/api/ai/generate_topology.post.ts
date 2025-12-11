import { defineEventHandler, readBody } from 'h3'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { safeSendMessage } from '~/server/utils/gemini'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

    if (!apiKey) {
        throw createError({ statusCode: 500, statusMessage: 'Gemini API Key not configured' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const systemPrompt = `You are an IBM Cloud Solutions Architect. The user wants to design a cloud topology.
    Your goal is to generate a diagram layout using standard IBM Cloud and Kubernetes resources.
  
    Available Node Types:
    
    [Infrastructure]
    - "vpc": VPC Network
    - "subnet": Subnet
    - "gateway": Public Gateway
    - "vpn": VPN Gateway
    - "classic-vsi": Virtual Server (Classic)
    - "barewriter": Bare Metal

    [Containers]
    - "kubernetes": Kubernetes Cluster
    - "openshift": Red Hat OpenShift
    - "registry": Container Registry
    - "code-engine": Code Engine

    [Kubernetes Resources]
    - "k8s-pod": Pod
    - "k8s-deployment": Deployment
    - "k8s-service": Service
    - "k8s-ingress": Ingress
    - "k8s-configmap": ConfigMap
    - "k8s-secret": Secret
    - "k8s-pvc": PVC
    - "k8s-cronjob": CronJob

    [Data & AI]
    - "cloudant": Cloudant NoSQL DB
    - "postgresql": PostgreSQL
    - "mongodb": MongoDB
    - "cos": Cloud Object Storage
    - "eventstreams": Event Streams (Kafka)
    - "watson": Watson Assistant
    - "watsonx": watsonx.ai

    [Security/Ops]
    - "key-protect": Key Protect
    - "secrets-manager": Secrets Manager
    - "observability": Observability
    - "activity-tracker": Activity Tracker
  
    Output ONLY valid JSON in the following format:
    {
      "message": "A brief explanation of the architecture.",
      "structuredData": {
          "nodes": [
              { "id": "node-1", "type": "openshift", "name": "Cluster-1", "x": 100, "y": 100, "isGroup": true, "width": 600, "height": 400 },
              { "id": "node-2", "type": "k8s-pod", "name": "App-Pod", "x": 150, "y": 150, "parentId": "node-1" }
          ],
          "connections": [
              { "from": "node-1", "to": "node-2" }
          ]
      }
    }
  
    Guidelines:
    1. **CONTAINMENT & HIERARCHY**: 
       - **Explicit Parent**: When a node (e.g. Pod) is inside a Cluster, set "parentId": "cluster-node-id".
       - This is CRITICAL for the layout engine to keep them together.
       - **Clusters**: Make them LARGE. Minimum width: 800, Minimum height: 600.
       - **VPCs**: Make them HUGE. Minimum width: 1000, Minimum height: 800.
       - **Padding**: Leave at least 50px padding around items inside a group. Do NOT place items on the very edge.
    2. **SPACING**:
       - **Spread out**: Keep at least 150px distance between sibling nodes (e.g., node-to-node).
       - **Hierarchical**: Place Ingress at top, Services below, Pods below Services, Databases outside/bottom.
    3. **CONNECTIONS**:
       - Connect logically: Ingress -> Service -> Pod -> Database.
       - Do not create "mesh" connections unless necessary. Keep flow clear (Top -> Down or Left -> Right).
    4. **Safety**: Keep x between 50-1200, y between 50-1000.
    5. Do not include markdown formatting.
    `

    try {
        const chatSession = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: "Understood. I will generate topology JSON including nodes and connections." }]
                },
                ...(body.history || [])
            ]
        })

        const result = await safeSendMessage(chatSession, body.message + " (Remember: Return JSON)")
        const response = await result.response
        let text = response.text()

        text = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const json = JSON.parse(text)
            return {
                response: json.message,
                structuredData: json.structuredData // { nodes: [], connections: [] }
            }
        } catch (e) {
            return {
                response: text
            }
        }
    } catch (err: any) {
        console.error('Gemini API Check Error:', err)
        throw createError({
            statusCode: 503,
            statusMessage: 'AI Service Unavailable: ' + (err.message || 'Unknown error')
        })
    }
})
