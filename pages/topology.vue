<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Node {
  id: string
  type: string
  name: string
  x: number
  y: number
  width?: number
  height?: number
  isGroup?: boolean
}

interface Connection {
  from: string
  to: string
}

const nodes = ref<Node[]>([])
const connections = ref<Connection[]>([])
const selectedNodeId = ref<string | null>(null)
const terraformCode = ref('')
const showTerraform = ref(false)

// Canvas Transform State
const transform = ref({ x: 0, y: 0, scale: 1 })
const isPanning = ref(false)
const lastMousePos = ref({ x: 0, y: 0 })

// Drag & Drop State
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const draggedNodeId = ref<string | null>(null)

// Connection Mode State
const isConnecting = ref(false)
const connectionStartNodeId = ref<string | null>(null)
const mousePos = ref({ x: 0, y: 0 }) // For drawing the temp line (in canvas space)

const canvasRef = ref<HTMLElement | null>(null)

const serviceCategories = [
  {
    name: 'Infrastructure',
    services: [
      { type: 'vpc', name: 'VPC', icon: '☁️', color: 'var(--ibm-blue-60)' },
      { type: 'subnet', name: 'Subnet', icon: '🕸️', color: 'var(--ibm-blue-50)' },
      { type: 'gateway', name: 'Public Gateway', icon: '🚪', color: 'var(--ibm-blue-50)' },
      { type: 'vpn', name: 'VPN Gateway', icon: '🔒', color: 'var(--ibm-blue-50)' },
      { type: 'classic-vsi', name: 'Classic VSI', icon: '🖥️', color: 'var(--ibm-gray-60)' },
      { type: 'barewriter', name: 'Bare Metal', icon: '🏗️', color: 'var(--ibm-gray-70)' },
    ]
  },
  {
    name: 'Container Platform',
    services: [
      { type: 'kubernetes', name: 'Kubernetes Cluster', icon: '☸️', color: 'var(--ibm-blue-60)' },
      { type: 'openshift', name: 'OpenShift', icon: '⭕', color: 'var(--ibm-red-60)' },
      { type: 'registry', name: 'Container Registry', icon: '🚢', color: 'var(--ibm-blue-40)' },
      { type: 'code-engine', name: 'Code Engine', icon: '🚀', color: 'var(--ibm-blue-50)' },
    ]
  },
  {
    name: 'Kubernetes Internals',
    services: [
      { type: 'k8s-pod', name: 'Pod', icon: '📦', color: 'var(--ibm-magenta-50)' },
      { type: 'k8s-deployment', name: 'Deployment', icon: '🔄', color: 'var(--ibm-magenta-60)' },
      { type: 'k8s-service', name: 'Service', icon: '🔌', color: 'var(--ibm-magenta-40)' },
      { type: 'k8s-ingress', name: 'Ingress', icon: '🚪', color: 'var(--ibm-magenta-50)' },
      { type: 'k8s-configmap', name: 'ConfigMap', icon: '📝', color: 'var(--ibm-teal-50)' },
      { type: 'k8s-secret', name: 'Secret', icon: '🔐', color: 'var(--ibm-teal-60)' },
      { type: 'k8s-pvc', name: 'PVC', icon: '💾', color: 'var(--ibm-cyan-50)' },
       { type: 'k8s-cronjob', name: 'CronJob', icon: '⏱️', color: 'var(--ibm-purple-50)' },
    ]
  },
  {
    name: 'Data & AI',
    services: [
      { type: 'cloudant', name: 'Cloudant DB', icon: '📄', color: 'var(--ibm-green-60)' },
      { type: 'postgresql', name: 'PostgreSQL', icon: '🐘', color: 'var(--ibm-green-50)' },
      { type: 'mongodb', name: 'MongoDB', icon: '🍃', color: 'var(--ibm-green-50)' },
      { type: 'cos', name: 'Object Storage', icon: '📦', color: 'var(--ibm-blue-50)' },
      { type: 'eventstreams', name: 'Event Streams', icon: '📨', color: 'var(--ibm-purple-50)' },
      { type: 'watson', name: 'Watson Assistant', icon: '🤖', color: 'var(--ibm-purple-60)' },
      { type: 'watsonx', name: 'watsonx.ai', icon: '🧠', color: 'var(--ibm-purple-70)' },
    ]
  },
  {
    name: 'Security & Ops',
    services: [
      { type: 'key-protect', name: 'Key Protect', icon: '🔑', color: 'var(--ibm-gray-60)' },
      { type: 'secrets-manager', name: 'Secrets Manager', icon: '🤐', color: 'var(--ibm-gray-60)' },
      { type: 'observability', name: 'Observability', icon: '🔭', color: 'var(--ibm-cyan-60)' },
      { type: 'activity-tracker', name: 'Activity Tracker', icon: '📊', color: 'var(--ibm-cyan-50)' },
    ]
  }
]

// Flattened list for easy lookup
const serviceTypes = computed(() => {
  return serviceCategories.flatMap(c => c.services)
})

// --- Helpers ---

// Convert screen/client coordinates to canvas world coordinates
const toCanvasCoords = (clientX: number, clientY: number) => {
    if (!canvasRef.value) return { x: 0, y: 0 }
    const rect = canvasRef.value.getBoundingClientRect()
    return {
        x: (clientX - rect.left - transform.value.x) / transform.value.scale,
        y: (clientY - rect.top - transform.value.y) / transform.value.scale
    }
}

// --- Node Management ---

const addNode = (type: string, name: string) => {
  // Add node at random position near center of view approx
  const centerX = (-transform.value.x + 200) / transform.value.scale
  const centerY = (-transform.value.y + 200) / transform.value.scale

  const node: Node = {
    id: `node-${Date.now()}`,
    type,
    name,
    x: centerX + Math.random() * 50,
    y: centerY + Math.random() * 50
  }
  nodes.value.push(node)
  selectedNodeId.value = node.id
}

const removeNode = (id: string) => {
  nodes.value = nodes.value.filter(n => n.id !== id)
  connections.value = connections.value.filter(c => c.from !== id && c.to !== id)
  if (selectedNodeId.value === id) selectedNodeId.value = null
}

const getNodeColor = (type: string) => {
  return serviceTypes.value.find(s => s.type === type)?.color || 'var(--ibm-gray-50)'
}

const selectNode = (id: string) => {
    if (isConnecting.value && connectionStartNodeId.value) {
        // Complete connection
        if (connectionStartNodeId.value !== id) {
             // Check if exists
             const exists = connections.value.find(c => c.from === connectionStartNodeId.value && c.to === id)
             if (!exists) {
                 connections.value.push({ from: connectionStartNodeId.value, to: id })
             }
        }
        isConnecting.value = false
        connectionStartNodeId.value = null
        return
    }
    selectedNodeId.value = id
}

// --- Interaction Handlers ---

// --- Interaction Handlers ---

const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    
    // Zoom logic
    const zoomIntensity = 0.05 // Reduced from 0.1
    const direction = event.deltaY > 0 ? -1 : 1
    const factor = 1 + (zoomIntensity * direction)
    
    // Limit zoom
    const newScale = Math.min(Math.max(transform.value.scale * factor, 0.2), 5)
    
    // Zoom towards mouse pointer
    if (canvasRef.value) {
        const rect = canvasRef.value.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        
        // Calculate point before zoom
        const pointX = (mouseX - transform.value.x) / transform.value.scale
        const pointY = (mouseY - transform.value.y) / transform.value.scale
        
        // Apply new scale
        transform.value.scale = newScale
        
        // Calculate new pan to keep point stationary
        transform.value.x = mouseX - pointX * newScale
        transform.value.y = mouseY - pointY * newScale
    }
}

const zoomIn = () => {
    const newScale = Math.min(transform.value.scale * 1.2, 5)
    // Zoom to center of canvas container
    updateZoomCenter(newScale)
}

const zoomOut = () => {
    const newScale = Math.max(transform.value.scale / 1.2, 0.2)
    updateZoomCenter(newScale)
}

const updateZoomCenter = (newScale: number) => {
    if (canvasRef.value) {
        const rect = canvasRef.value.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        
        const pointX = (centerX - transform.value.x) / transform.value.scale
        const pointY = (centerY - transform.value.y) / transform.value.scale
        
        transform.value.scale = newScale
        transform.value.x = centerX - pointX * newScale
        transform.value.y = centerY - pointY * newScale
    }
}

const onCanvasMouseDown = (event: MouseEvent) => {
    // Start Panning if not interacting with items (already handled by stopPropagation)
    // Middle mouse or left mouse on background
    if (event.button === 0 || event.button === 1) {
        isPanning.value = true
        lastMousePos.value = { x: event.clientX, y: event.clientY }
    }
}


const startDrag = (event: MouseEvent, node: Node) => {
  if (isConnecting.value) return 

  isDragging.value = true
  draggedNodeId.value = node.id
  selectedNodeId.value = node.id
  
  // Calculate offset relative to node top-left in Canvas Coords
  // We need current mouse position in canvas coords
  const mouseInCanvas = toCanvasCoords(event.clientX, event.clientY)
  
  dragOffset.value = {
    x: mouseInCanvas.x - node.x,
    y: mouseInCanvas.y - node.y
  }
}

const onCanvasMouseMove = (event: MouseEvent) => {
    // 1. Panning
    if (isPanning.value) {
        const dx = event.clientX - lastMousePos.value.x
        const dy = event.clientY - lastMousePos.value.y
        transform.value.x += dx
        transform.value.y += dy
        lastMousePos.value = { x: event.clientX, y: event.clientY }
        return
    }

    // 2. Dragging Node
    if (isDragging.value && draggedNodeId.value) {
      const node = nodes.value.find(n => n.id === draggedNodeId.value)
      if (node) {
        const mouseInCanvas = toCanvasCoords(event.clientX, event.clientY)
        node.x = mouseInCanvas.x - dragOffset.value.x
        node.y = mouseInCanvas.y - dragOffset.value.y
      }
    }
    
    // 3. Connecting Line
    if (isConnecting.value) {
         mousePos.value = toCanvasCoords(event.clientX, event.clientY)
    }
}

const onCanvasMouseUp = () => {
    isDragging.value = false
    draggedNodeId.value = null
    isPanning.value = false
}

const startConnection = (nodeId: string, event: MouseEvent) => {
    event.stopPropagation() 
    isConnecting.value = true
    connectionStartNodeId.value = nodeId
    // Set initial mouse pos
    mousePos.value = toCanvasCoords(event.clientX, event.clientY)
}

const cancelConnection = () => {
    isConnecting.value = false
    connectionStartNodeId.value = null
}

onMounted(() => {
    window.addEventListener('mouseup', onCanvasMouseUp)
    window.addEventListener('mousemove', onCanvasMouseMove)
})

onUnmounted(() => {
    window.removeEventListener('mouseup', onCanvasMouseUp)
    window.removeEventListener('mousemove', onCanvasMouseMove)
})


// --- Terraform ---

const generateTerraform = () => {
  let code = '# IBM Cloud Topology - Generated by IBM Ease\n\n'
  code += 'terraform {\n  required_providers {\n    ibm = {\n      source = "IBM-Cloud/ibm"\n      version = "~> 1.59.0"\n    }\n  }\n}\n\n'
  code += 'variable "region" { default = "us-south" }\n'
  code += 'variable "resource_group_id" {}\n\n'
  code += 'provider "ibm" {\n  region = var.region\n}\n\n'

  nodes.value.forEach(node => {
      const safeName = node.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
      
      code += `resource "ibm_${node.type}" "${safeName}_${node.id.split('-')[1]}" {\n`
      code += `  name              = "${node.name}"\n`
      code += `  resource_group_id = var.resource_group_id\n`
      code += `  # Position: x=${Math.round(node.x)}, y=${Math.round(node.y)}\n`
      
      // Look for dependencies
      const deps = connections.value.filter(c => c.to === node.id)
      if (deps.length > 0) {
          code += `  depends_on        = [ ${deps.map(d => {
              const pNode = nodes.value.find(n => n.id === d.from)
              if(!pNode) return ''
              const pSafeName = pNode.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
              return `ibm_${pNode.type}.${pSafeName}_${pNode.id.split('-')[1]}`
          }).join(', ')} ]\n`
      }
      
      code += `}\n\n`
  })

  terraformCode.value = code
  showTerraform.value = true
}

// Helper to get center of a node for lines
const getNodeCenter = (nodeId: string) => {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }
    
    // Default size
    const w = node.width || 200
    const h = node.height || 64 
    
    return {
        x: node.x + w / 2,
        y: node.y + h / 2
    }
}

// Simple orthogonal routing
const getConnectionPath = (fromId: string, toId: string) => {
    const start = getNodeCenter(fromId)
    const end = getNodeCenter(toId)
    
    // Calculate mid-points for elbow
    const midX = (start.x + end.x) / 2
    
    // M startX startY L midX startY L midX endY L endX endY
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`
}

const getTempConnectionPath = (fromId: string, mouse: {x: number, y: number}) => {
    const start = getNodeCenter(fromId)
    const midX = (start.x + mouse.x) / 2
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${mouse.y} L ${mouse.x} ${mouse.y}`
}

const handleTopologyUpdate = (data: any) => {
    if (data.nodes && Array.isArray(data.nodes)) {
        nodes.value = data.nodes
    }
    if (data.connections && Array.isArray(data.connections)) {
        connections.value = data.connections
    }
}
// --- Icons ---
const ChevronDown = '▼'
const ChevronRight = '▶'

// --- State ---
const collapsedCategories = ref<Set<string>>(new Set())

const toggleCategory = (categoryName: string) => {
    if (collapsedCategories.value.has(categoryName)) {
        collapsedCategories.value.delete(categoryName)
    } else {
        collapsedCategories.value.add(categoryName)
    }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="page-container">
      <section class="section-header">
        <div class="header-content">
          <h2 class="section-title">Cloud Topology Builder</h2>
          <p class="header-sub">Design IBM Cloud architecture visually. Drag, drop, and connect.</p>
        </div>
        <div class="header-actions">
           <span class="badge">Canvas Alpha</span>
        </div>
      </section>

      <div class="topology-grid">
      <!-- Tool Palette -->
      <section class="card tool-palette">
        <h3 class="card-title">Services</h3>
          <div class="services-list">
            <div v-for="category in serviceCategories" :key="category.name" class="service-category">
                <button class="category-header-btn" @click="toggleCategory(category.name)">
                    <span class="category-icon">
                        {{ collapsedCategories.has(category.name) ? ChevronRight : ChevronDown }}
                    </span>
                    <span class="category-title">{{ category.name }}</span>
                </button>
                
                <div v-show="!collapsedCategories.has(category.name)" class="category-items">
                    <button
                    v-for="service in category.services"
                    :key="service.type"
                    class="service-btn"
                    @click="addNode(service.type, service.name)"
                    >
                    <span class="service-icon">{{ service.icon }}</span>
                    <span class="service-name">{{ service.name }}</span>
                    </button>
                </div>
            </div>
          </div>
          <div class="palette-actions">
            <button class="primary-btn full-width" @click="generateTerraform" :disabled="nodes.length === 0">
              Generate Terraform
            </button>
          </div>
        </section>

        <!-- Canvas -->
        <section class="card canvas-container">
          <div 
             ref="canvasRef" 
             class="canvas" 
             :class="{ 'connecting-mode': isConnecting, 'panning-mode': isPanning }" 
             @click="cancelConnection"
             @wheel="onWheel"
             @mousedown="onCanvasMouseDown"
          >
             <!-- Transform Container -->
             <div class="canvas-content" :style="{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }">
                 
                 <!-- SVG Layer for Connections -->
                 <svg class="connections-layer">
                     <defs>
                         <marker id="arrowhead" markerWidth="14" markerHeight="10" refX="14" refY="5" orient="auto">
                             <polygon points="0 0, 14 5, 0 10" fill="#6f6f6f" />
                         </marker>
                     </defs>
                     
                     <!-- Existing Connections -->
                     <path 
                       v-for="(conn, idx) in connections"
                       :key="idx"
                       :d="getConnectionPath(conn.from, conn.to)"
                       stroke="#6f6f6f"
                       stroke-width="2"
                       fill="none"
                       marker-end="url(#arrowhead)"
                     />

                     <!-- Temp Connection Line -->
                     <path 
                       v-if="isConnecting && connectionStartNodeId"
                       :d="getTempConnectionPath(connectionStartNodeId, mousePos)"
                       stroke="#4589ff"
                       stroke-width="2"
                       stroke-dasharray="5,5"
                       fill="none"
                     />
                 </svg>

                <div
                  v-for="node in nodes"
                  :key="node.id"
                  class="node"
                  :class="{ selected: selectedNodeId === node.id, 'is-group': node.isGroup }"
                  :style="{
                    left: node.x + 'px',
                    top: node.y + 'px',
                    width: (node.width || 200) + 'px',
                    height: node.height ? node.height + 'px' : 'auto',
                    borderColor: selectedNodeId === node.id ? '#4589ff' : (node.isGroup ? '#e0e0e0' : '#393939'),
                    zIndex: node.isGroup ? 0 : 1,
                    backgroundColor: node.isGroup ? 'rgba(240, 240, 240, 0.4)' : 'var(--cds-layer)',
                    borderStyle: node.isGroup ? 'dashed' : 'solid',
                    borderWidth: node.isGroup ? '2px' : '1px'
                  }"
                  @mousedown.stop="startDrag($event, node)"
                  @click.stop="selectNode(node.id)"
                >
                  <div class="node-header" :style="{ background: node.isGroup ? 'transparent' : getNodeColor(node.type), borderBottom: node.isGroup ? 'none' : 'none' }">
                    <span v-if="!node.isGroup">{{ serviceTypes.find(s => s.type === node.type)?.icon || '❓' }}</span>
                    <span :style="{ fontSize: node.isGroup ? '14px' : '12px', fontWeight: '600', color: node.isGroup ? '#525252' : '#fff' }">
                         {{ node.isGroup ? node.name.toUpperCase() : (serviceTypes.find(s => s.type === node.type)?.name || node.type) }}
                    </span>
                    <div class="node-actions">
                        <!-- Connect Button -->
                        <button class="node-action-btn" title="Connect" @mousedown.stop @click.stop="startConnection(node.id, $event)">
                            🔗
                        </button>
                        <button class="node-close" @mousedown.stop @click.stop="removeNode(node.id)">×</button>
                    </div>
                  </div>
                  <div class="node-body" v-if="!node.isGroup">
                    <div class="node-name">{{ node.name }}</div>
                    <div class="node-id">{{ node.id.split('-')[1] }}</div>
                  </div>
                </div>
            </div> <!-- End Transform Content -->

            <div v-if="nodes.length === 0" class="canvas-empty">
              <div class="empty-icon">🏗️</div>
              <div class="empty-title">Start building</div>
              <div class="empty-sub">Drag services or ask AI →</div>
            </div>
            
            <div v-if="isConnecting" class="connection-hint">
              Select a target node to connect... (Click background to cancel)
            </div>

            <!-- Zoom Controls -->
            <div class="zoom-controls">
                <button class="zoom-btn" @click.stop="zoomIn" title="Zoom In">+</button>
                <div class="zoom-divider"></div>
                <button class="zoom-btn" @click.stop="zoomOut" title="Zoom Out">−</button>
            </div>
          </div>
        </section>
        
        <!-- AI Assistant -->
        <section class="card ai-panel">
            <h3 class="card-title">AI Architect</h3>
            <div class="ai-container">
                 <AIChat mode="topology" @update="handleTopologyUpdate"></AIChat>
            </div>
        </section>
      </div>

      <section v-if="showTerraform" class="card terraform-modal">
        <div class="modal-header">
          <h3 class="card-title">Generated Terraform</h3>
          <button class="secondary-btn small" @click="showTerraform = false">Close</button>
        </div>
        <pre class="code-block">{{ terraformCode }}</pre>
        <button class="primary-btn" style="margin-top: 16px;">Download .tf files</button>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout */
/* .topology-wrapper removed, uses global body */

/* .topology-container removed, uses global .container */

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0px; 
}

.header-sub {
  font-size: 14px;
  color: var(--cds-text-secondary);
  line-height: 1.4;
  margin: 0;
}



/* Grid Layout */
.topology-grid {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 16px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

/* Card Styling */
/* .topology-card removed, uses global .card */

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #f4f4f4;
  margin: 0 0 16px;
  letter-spacing: 0.16px;
}

/* Tool Palette */
.services-list {
  display: flex;
  flex-direction: column;
  gap: 16px; /* Space between categories */
  flex: 1;
  overflow-y: auto;
  padding-right: 8px; /* space for scrollbar */
}

.service-category {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.category-header-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #8d8d8d;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.1s;
}

.category-header-btn:hover {
    color: #f4f4f4;
}

.category-icon {
    font-size: 10px;
    width: 12px;
    display: flex;
    justify-content: center;
}

.category-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 8px; /* Indent items */
}

.service-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid transparent;
  background: #393939; /* Gray 80 */
  color: #f4f4f4;
  cursor: pointer;
  transition: all 0.1s;
  font-size: 13px;
  text-align: left;
  border-radius: 4px;
}

.service-btn:hover {
  background: #4c4c4c; /* Gray 70 */
}

.service-icon {
  font-size: 18px;
}

.palette-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #393939;
}

/* Canvas */
.canvas-container {
  padding: 0;
  border: 1px solid #393939;
  overflow: hidden;
  position: relative;
}

.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #161616;
  background-image: radial-gradient(#393939 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: hidden;
  cursor: grab; /* Default cursor indicates panning */
}

.canvas.connecting-mode {
    cursor: crosshair;
}

.canvas.panning-mode {
    cursor: grabbing;
}

.canvas-content {
    width: 100%;
    height: 100%;
    transform-origin: 0 0;
    pointer-events: none; /* Let clicks pass through to container or nodes */
}

.canvas-content > * {
    pointer-events: auto; /* Re-enable pointer events for children (nodes) */
}

/* Fix SVG sizing to cover potential infinite canvas simulation by just being huge? 
   Actually, with transform on parent, the SVG just needs to be large enough or 100% of container. 
   Since we transform the container DIV, the SVG inside moves with it. 
   So 100% width/height is relative to that transformed div which might be confusing.
   
   Better approach: .canvas-content is 0x0 size but allows overflow? 
   Or just keep it 100% of view and rely on the fact that connections are drawn based on node coords.
*/

.connections-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: visible; /* Important for lines going off screen */
    pointer-events: none;
    z-index: 0;
}

.canvas-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #f4f4f4;
  margin-bottom: 8px;
}

.empty-sub {
  color: #c6c6c6;
  font-size: 14px;
}

.connection-hint {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #393939;
    color: #f4f4f4;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 10;
    border: 1px solid #525252;
}

.zoom-controls {
    position: absolute;
    bottom: 24px;
    right: 24px;
    background: #262626;
    border: 1px solid #393939;
    border-radius: 4px; /* Optional rounded corners for the group */
    display: flex;
    flex-direction: column;
    z-index: 10;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.zoom-btn {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    color: #f4f4f4;
    font-size: 18px;
    font-weight: 300;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s;
}

.zoom-btn:hover {
    background: #393939;
}

.zoom-divider {
    height: 1px;
    background: #393939;
    width: 100%;
}

/* Nodes */
.node {
  position: absolute;
  width: 200px;
  background: #262626; /* Gray 90 */
  border: 1px solid #393939;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  cursor: grab;
  z-index: 1;
  user-select: none;
}

.node:active {
    cursor: grabbing;
}

.node.selected {
  box-shadow: 0 0 0 1px #4589ff; /* Blue 60 */
  z-index: 2;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  color: #ffffff;
  font-weight: 600;
}

.node-actions {
    display: flex;
    gap: 4px;
    align-items: center;
}

.node-action-btn, 
.node-close {
  background: rgba(0, 0, 0, 0.2);
  border: none;
  color: #ffffff;
  width: 20px;
  height: 20px;
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 0;
  transition: background 0.1s;
}

.node-action-btn:hover,
.node-close:hover {
  background: rgba(0, 0, 0, 0.4);
}

.node-body {
  padding: 12px;
}

.node-name {
  font-size: 14px;
  font-weight: 400;
  color: #f4f4f4;
}

.node-id {
  font-size: 10px;
  color: #8d8d8d;
  margin-top: 4px;
  font-family: 'IBM Plex Mono', monospace;
}

/* AI Panel */
.ai-container {
    flex: 1;
    border: 1px solid #393939;
    background: #161616;
    overflow: hidden;
}

/* Buttons (Shared with Home) */
/* .primary-btn and .secondary-btn are global */

.full-width {
    width: 100%;
}

.small {
    padding: 6px 12px;
    font-size: 12px;
}

/* Terraform Modal */
.terraform-modal {
    position: fixed;
    bottom: 32px;
    right: 32px;
    width: 500px;
    max-width: 90vw;
    z-index: 100;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    border: 1px solid #525252;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.code-block {
  background: #161616;
  color: #f4f4f4;
  padding: 16px;
  border: 1px solid #393939;
  overflow-x: auto;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  height: 300px;
  overflow-y: auto;
}
</style>
