import './vanity.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import gsap from 'gsap'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/* ============================================================
   UTILITY
   ============================================================ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/* ============================================================
   VANITY PART METADATA
   ============================================================ */
const PART_META = [
    { material: 'Solid Oak', finish: 'Matte Walnut Stain', spec: 'FSC Certified', category: 'Cabinet Frame' },
    { material: 'MDF Core', finish: 'Thermofoil Wrap', spec: 'CARB2 Compliant', category: 'Cabinet Door' },
    { material: 'Porcelain', finish: 'Gloss White', spec: 'ANSI/ASSE 1064', category: 'Sink Basin' },
    { material: 'Brass Alloy', finish: 'Brushed Gold', spec: 'CEN EN 12164', category: 'Faucet' },
    { material: 'Tempered Glass', finish: 'Ultra-Clear', spec: 'ASTM C1036', category: 'Mirror Face' },
    { material: 'Stainless Steel 304', finish: 'Brushed Satin', spec: 'ASTM A240', category: 'Drawer Pull' },
    { material: 'Soft-Close Hinge', finish: 'Nickel Plate', spec: 'BHMA A156.9', category: 'Cabinet Hinge' },
    { material: 'ABS Polymer', finish: 'Matte Black', spec: 'ISO 2580', category: 'Drain Assembly' },
    { material: 'Composite Stone', finish: 'Honed Quartz', spec: 'NSF/ANSI 61', category: 'Countertop' },
    { material: 'Plywood Baltic Birch', finish: 'Lacquer Spray', spec: 'EN 636', category: 'Shelf Board' },
    { material: 'EPDM Rubber', finish: 'Matte Black', spec: 'ASTM D1418', category: 'Sink Gasket' },
    { material: 'Stainless Steel 316', finish: 'Polished Mirror', spec: 'AISI 316', category: 'P-Trap' },
    { material: 'Zinc Die-Cast', finish: 'Rose Gold', spec: 'ASTM B86', category: 'Handle' },
    { material: 'Acrylic', finish: 'Crystal Clear', spec: 'UL 94 V-0', category: 'Light Diffuser' },
    { material: 'LED Strip', finish: 'Warm White 2700K', spec: 'IP44 Rated', category: 'Under-Mount Light' },
    { material: 'Solid Hardwood', finish: 'Matte Lacquer', spec: 'KCMA A161.1', category: 'Toe Kick' },
    { material: 'Laminate MDF', finish: 'Matte Linen', spec: 'CARB2 Compliant', category: 'Drawer Box' },
    { material: 'Undermount Rails', finish: 'Satin Nickel', spec: 'BHMA A156.9', category: 'Drawer Slide' },
    { material: 'PVD Brass', finish: 'Brushed Champagne', spec: 'ISO 3613', category: 'Supply Valve' },
]
const getMeta = (i) => PART_META[i % PART_META.length]

/* ============================================================
   NAMED LABELS — the 4 key vanity components to annotate
   ============================================================ */
const NAMED_LABELS = [
    {
        searchKeywords: ['mirror', 'glass', 'reflect'],
        displayName: 'Mirror Panel',
        material: 'Tempered Ultra-Clear Glass',
        dir3D: new THREE.Vector3(1.1, 0.9, 0.3),
        side: 'right'
    },
    {
        searchKeywords: ['basin', 'sink', 'bowl', 'porcelain'],
        displayName: 'Sink Basin',
        material: 'Vitreous Porcelain — Gloss White',
        dir3D: new THREE.Vector3(1.2, 0.0, 0.3),
        side: 'right'
    },
    {
        searchKeywords: ['countertop', 'stone', 'quartz', 'top'],
        displayName: 'Quartz Countertop',
        material: 'Composite Stone — Honed Finish',
        dir3D: new THREE.Vector3(-1.2, 0.2, -0.2),
        side: 'left'
    },
    {
        searchKeywords: ['cabinet', 'frame', 'body', 'box', 'carcass'],
        displayName: 'Cabinet Frame',
        material: 'Solid Oak — Walnut Stain',
        dir3D: new THREE.Vector3(-1.0, -0.9, -0.2),
        side: 'left'
    },
]

/* ============================================================
   SCENE SETUP
   ============================================================ */
const canvas = document.getElementById('webgl-canvas')
const scene = new THREE.Scene()
scene.background = new THREE.Color('#09080c')
scene.fog = new THREE.FogExp2(0x09080c, 0.032)

/* ============================================================
   SIZES & RESIZE
   ============================================================ */
const sizes = { width: window.innerWidth, height: window.innerHeight }

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    updateLabels()
})

/* ============================================================
   CAMERA
   ============================================================ */
const camera = new THREE.PerspectiveCamera(38, sizes.width / sizes.height, 0.01, 300)
camera.position.set(6, 4, 9)
scene.add(camera)

/* ============================================================
   RENDERER
   ============================================================ */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.6
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace

/* ============================================================
   ENVIRONMENT & LIGHTING
   ============================================================ */
const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

// Ambient
const ambientLight = new THREE.AmbientLight(0xf5e8d4, 0.6)
scene.add(ambientLight)

// Key — warm overhead light (simulating bathroom ceiling fixture)
const keyLight = new THREE.DirectionalLight(0xfff5e0, 2.8)
keyLight.position.set(6, 12, 7)
keyLight.castShadow = true
keyLight.shadow.mapSize.set(2048, 2048)
keyLight.shadow.camera.near = 0.1
keyLight.shadow.camera.far = 60
keyLight.shadow.camera.top = 16; keyLight.shadow.camera.right = 16
keyLight.shadow.camera.bottom = -16; keyLight.shadow.camera.left = -16
keyLight.shadow.bias = -0.001
scene.add(keyLight)

// Fill — cool blue from the opposite side (sky/window bounce)
const fillLight = new THREE.DirectionalLight(0xb0d4ff, 1.0)
fillLight.position.set(-8, 3, -5)
scene.add(fillLight)

// Rim — warm champagne rim for vanity cabinet edges
const rimLight = new THREE.DirectionalLight(0xffd5a0, 0.55)
rimLight.position.set(0, -5, -9)
scene.add(rimLight)

// Accent — warm golden point for countertop
const warmPoint = new THREE.PointLight(0xffcf80, 2.8, 35)
warmPoint.position.set(-3, 7, 4)
scene.add(warmPoint)

// Secondary accent — soft blue-white for mirror area
const coolPoint = new THREE.PointLight(0xe0f0ff, 1.2, 22)
coolPoint.position.set(4, 8, -2)
scene.add(coolPoint)

/* ============================================================
   CONTROLS
   ============================================================ */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.055
controls.minDistance = 0.5
controls.maxDistance = 50
controls.maxPolarAngle = Math.PI * 0.84

/* ============================================================
   STATE
   ============================================================ */
const state = {
    explosionFactor: 0,
    labelsVisible: true,
    isAnimating: false,
    parts: [],
    modelLoaded: false,
    hoveredPart: null,
    activePart: null,
    model: null,
    maxDim: 3,
    wireframe: false,
}
window.state = state // EXPOSE FOR DEBUGGING

/* ============================================================
   RAYCASTER
   ============================================================ */
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

/* ============================================================
   LOADING SCREEN
   ============================================================ */
const loadingScreen = document.getElementById('loading-screen')
const loadingBar = document.getElementById('loading-bar')
const loadingText = document.getElementById('loading-text')

const setLoadProgress = (pct, text) => {
    loadingBar.style.width = pct + '%'
    if (text) loadingText.textContent = text
}

const hideLoadingScreen = () => {
    loadingScreen.classList.add('hidden')
    // Add subtle grid overlay
    const grid = document.createElement('div')
    grid.className = 'grid-overlay'
    document.body.insertBefore(grid, canvas)
    // Add scanlines for atmosphere
    const scan = document.createElement('div')
    scan.className = 'scanlines'
    document.body.insertBefore(scan, canvas)
    // Mark status badge as ready
    const badge = document.getElementById('status-badge')
    badge.textContent = 'Ready'
    badge.classList.add('ready')
}

/* ============================================================
   PARTS LIST SIDEBAR
   ============================================================ */
const partsList = document.getElementById('parts-list')
const partsCount = document.getElementById('parts-count')

const buildPartsList = () => {
    partsList.innerHTML = ''
    partsCount.textContent = state.parts.length

    state.parts.forEach((part, i) => {
        const meta = getMeta(i)
        const item = document.createElement('div')
        item.className = 'part-item'
        item.id = `part-item-${i}`
        item.innerHTML = `
            <div class="part-index">${i + 1}</div>
            <div class="part-info">
                <div class="part-name">${part.mesh.name || meta.category}</div>
                <div class="part-sub">${meta.material}</div>
            </div>
        `
        item.addEventListener('click', () => focusOnPart(i))
        partsList.appendChild(item)
    })
}

/* ============================================================
   PART HIGHLIGHT
   ============================================================ */
const highlightPart = (index, on) => {
    const part = state.parts[index]
    if (!part) return
    const mats = Array.isArray(part.mesh.material) ? part.mesh.material : [part.mesh.material]
    mats.forEach(m => {
        if (m && m.emissive !== undefined) {
            m.emissive.setHex(on ? 0x1a0e04 : 0x000000)
        }
    })
}

/* ============================================================
   FOCUS ON PART
   ============================================================ */
const focusOnPart = (index) => {
    const part = state.parts[index]
    if (!part) return

    // Deselect old
    if (state.activePart !== null) {
        highlightPart(state.activePart, false)
        document.getElementById(`part-item-${state.activePart}`)?.classList.remove('active')
    }

    state.activePart = index
    highlightPart(index, true)
    document.getElementById(`part-item-${index}`)?.classList.add('active')

    // Scroll list item into view
    document.getElementById(`part-item-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    // Animate camera target
    const wp = new THREE.Vector3()
    part.mesh.getWorldPosition(wp)
    gsap.to(controls.target, {
        x: wp.x, y: wp.y, z: wp.z,
        duration: 0.9,
        ease: 'power2.inOut',
        onUpdate: () => controls.update()
    })
}

/* ============================================================
   EXPLOSION CONTROL
   ============================================================ */
const sliderEl = document.getElementById('explosion-slider')
const sliderFill = document.getElementById('slider-fill')
const sliderDisplay = document.getElementById('slider-value-display')

const setExplosionFactor = (value) => {
    state.explosionFactor = value
    state.parts.forEach(part => {
        const offset = part.direction.clone().multiplyScalar(value)
        part.mesh.position.copy(part.initialPos).add(offset)
    })
    const pct = value * 100
    sliderEl.value = pct
    sliderFill.style.width = pct + '%'
    sliderDisplay.textContent = Math.round(pct) + '%'
    updateLabels()
}

sliderEl.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100
    setExplosionFactor(val)
    gsap.killTweensOf(state)
    if (state.model) {
        gsap.killTweensOf(state.model.rotation)
        gsap.to(state.model.rotation, { x: 0, y: 0, duration: 0.4 })
    }
})

/* ============================================================
   EXPLODE BUTTON
   ============================================================ */
const btnExplode = document.getElementById('btn-explode')

btnExplode.addEventListener('click', () => {
    if (state.isAnimating) return
    const target = state.explosionFactor > 0.1 ? 0 : 1
    const label = target > 0 ? 'Collapse' : 'Explode'

    state.isAnimating = true
    btnExplode.textContent = '...'

    const tl = gsap.timeline({
        onComplete: () => {
            state.isAnimating = false
            btnExplode.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    ${target === 0
                    ? '<polygon points="5 3 19 12 5 21 5 3"/>'
                    : '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>'}
                </svg>
                ${label}`
        }
    })

    if (target > 0) {
        // Explode
        tl.to(state, {
            explosionFactor: 1,
            duration: 3.2,
            ease: 'power3.inOut',
            onUpdate: () => setExplosionFactor(state.explosionFactor)
        })
        if (state.model) {
            tl.to(state.model.rotation, {
                x: Math.PI * 0.06,
                y: -(18 * Math.PI) / 180,
                duration: 1.6,
                ease: 'power2.out'
            }, '+=0.1')
        }
    } else {
        // Collapse
        if (state.model) {
            tl.to(state.model.rotation, {
                x: 0, y: 0,
                duration: 1.4,
                ease: 'power2.inOut'
            })
        }
        tl.to(state, {
            explosionFactor: 0,
            duration: 3.0,
            ease: 'power3.inOut',
            onUpdate: () => setExplosionFactor(state.explosionFactor)
        }, '>')
    }
})

/* ============================================================
   RESET
   ============================================================ */
const btnReset = document.getElementById('btn-reset')

btnReset.addEventListener('click', () => {
    gsap.killTweensOf(state)
    if (state.model) {
        gsap.killTweensOf(state.model.rotation)
        gsap.to(state.model.rotation, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' })
    }
    gsap.to(state, {
        explosionFactor: 0,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => setExplosionFactor(state.explosionFactor),
        onComplete: () => {
            state.isAnimating = false
            btnExplode.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Explode`
        }
    })
    gsap.to(camera.position, {
        x: state._cameraDefaultPos?.x ?? 6,
        y: state._cameraDefaultPos?.y ?? 4,
        z: state._cameraDefaultPos?.z ?? 9,
        duration: 1.5, ease: 'power2.out'
    })
    gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.5, ease: 'power2.out', onUpdate: () => controls.update() })

    if (state.activePart !== null) {
        highlightPart(state.activePart, false)
        document.getElementById(`part-item-${state.activePart}`)?.classList.remove('active')
        state.activePart = null
    }
})

/* ============================================================
   LABELS TOGGLE
   ============================================================ */
const btnLabels = document.getElementById('btn-labels')
btnLabels.addEventListener('click', () => {
    state.labelsVisible = !state.labelsVisible
    btnLabels.classList.toggle('active', state.labelsVisible)
    updateLabels()
})

/* ============================================================
   WIREFRAME TOGGLE
   ============================================================ */
const btnWireframe = document.getElementById('btn-wireframe')
btnWireframe.addEventListener('click', () => {
    state.wireframe = !state.wireframe
    btnWireframe.classList.toggle('active', state.wireframe)
    state.parts.forEach(p => {
        const mats = Array.isArray(p.mesh.material) ? p.mesh.material : [p.mesh.material]
        mats.forEach(m => { if (m) m.wireframe = state.wireframe })
    })
})

/* ============================================================
   LABEL SYSTEM — leader lines & cards
   ============================================================ */
let labelItems = []
const labelsSVG = document.getElementById('labels-svg')

const _localCenter = new THREE.Vector3()
const _worldAnchor = new THREE.Vector3()

const getGeometricCenter = (mesh) => {
    mesh.updateWorldMatrix(true, false)
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    mesh.geometry.boundingBox.getCenter(_localCenter)
    _worldAnchor.copy(_localCenter).applyMatrix4(mesh.matrixWorld)
    return _worldAnchor.clone()
}

const _ndcVec = new THREE.Vector3()
const projectWorldPoint = (worldPos) => {
    _ndcVec.copy(worldPos).project(camera)
    return {
        x: (_ndcVec.x + 1) * 0.5 * sizes.width,
        y: (-_ndcVec.y + 1) * 0.5 * sizes.height,
        visible: _ndcVec.z < 1
    }
}

const findPartByKeywords = (keywords) => {
    for (const part of state.parts) {
        const n = (part.mesh.name || '').toLowerCase()
        if (keywords.some(kw => n.includes(kw.toLowerCase()))) return part
    }
    return null
}

const ZONE_FRACTS = [0.05, 0.30, 0.65, 0.92]

const createInfoButtons = () => {
    labelItems.forEach(({ svgLine, svgDot, numEl, card }) => {
        svgLine?.remove(); svgDot?.remove()
        numEl?.remove(); card?.remove()
    })
    labelItems = []
    labelsSVG.innerHTML = ''

    console.log('[Vanity Labels] mesh names:')
    state.parts.forEach((p, i) => console.log(`  [${i}] "${p.mesh.name}"`))

    const sorted = state.parts.map(p => ({
        part: p,
        cy: getGeometricCenter(p.mesh).y
    })).sort((a, b) => b.cy - a.cy)

    const N = sorted.length

    NAMED_LABELS.forEach((labelDef, k) => {
        let foundPart = findPartByKeywords(labelDef.searchKeywords)
        const method = foundPart ? 'keyword' : 'spatial'
        if (!foundPart) {
            const idx = Math.min(Math.round(ZONE_FRACTS[k] * (N - 1)), N - 1)
            foundPart = sorted[idx].part
        }
        if (!foundPart) return

        console.log(`[Vanity Labels] "${labelDef.displayName}" → "${foundPart.mesh.name}" (${method})`)

        const isRight = labelDef.side === 'right'

        const svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        svgLine.classList.add('leader-line')
        labelsSVG.appendChild(svgLine)

        const svgDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        svgDot.classList.add('leader-dot')
        svgDot.setAttribute('r', '4')
        labelsSVG.appendChild(svgDot)

        const numEl = document.createElement('div')
        numEl.className = 'leader-num'
        numEl.innerHTML = `<i>i</i>`
        numEl.style.opacity = '0'
        numEl.style.pointerEvents = 'none'
        document.body.appendChild(numEl)

        const card = document.createElement('div')
        card.className = `leader-card ${isRight ? 'card-right' : 'card-left'}`
        card.innerHTML = `
            <div class="leader-card-label">${labelDef.displayName}</div>
            <div class="leader-card-text">${labelDef.material}</div>
        `
        card.style.pointerEvents = 'none'
        document.body.appendChild(card)

        numEl.addEventListener('click', (e) => {
            e.stopPropagation()
            const wasOpen = card.classList.contains('open')
            labelItems.forEach(it => { it.card.classList.remove('open'); it.numEl.classList.remove('active') })
            if (!wasOpen) { card.classList.add('open'); numEl.classList.add('active') }
        })

        labelItems.push({ svgLine, svgDot, numEl, card, mesh: foundPart.mesh, labelDef, isRight })
    })

    document.addEventListener('click', () => {
        labelItems.forEach(it => { it.card.classList.remove('open'); it.numEl.classList.remove('active') })
    })
}

const updateLabels = () => {
    const factor = state.explosionFactor
    const show = state.labelsVisible && factor > 0.02
    const alpha = clamp((factor - 0.02) / 0.32, 0, 1)
    const aStr = alpha.toFixed(3)

    labelItems.forEach(({ svgLine, svgDot, numEl, card, mesh, labelDef, isRight }) => {
        const hide = () => {
            svgLine.style.opacity = '0'; svgDot.style.opacity = '0'
            numEl.style.opacity = '0'; numEl.style.pointerEvents = 'none'
            card.classList.remove('open'); numEl.classList.remove('active')
        }
        if (!show) { hide(); return }

        const worldCenter = getGeometricCenter(mesh)
        const p = projectWorldPoint(worldCenter)
        if (!p.visible) { hide(); return }

        const offset = labelDef.dir3D.clone()
        if (state.model) offset.applyQuaternion(state.model.quaternion)
        offset.multiplyScalar(state.maxDim * 0.44)

        const badgeWorld = worldCenter.clone().add(offset)
        const bp = projectWorldPoint(badgeWorld)
        if (!bp.visible) { hide(); return }

        svgDot.setAttribute('cx', p.x); svgDot.setAttribute('cy', p.y)
        svgDot.style.opacity = aStr

        svgLine.setAttribute('x1', p.x); svgLine.setAttribute('y1', p.y)
        svgLine.setAttribute('x2', bp.x); svgLine.setAttribute('y2', bp.y)
        svgLine.style.opacity = aStr

        numEl.style.left = bp.x + 'px'; numEl.style.top = bp.y + 'px'
        numEl.style.opacity = aStr; numEl.style.pointerEvents = 'auto'

        const cOff = isRight ? 26 : -26
        card.style.left = (bp.x + cOff) + 'px'
        card.style.top = (bp.y - 8) + 'px'
    })
}

/* ============================================================
   HOVER TOOLTIP
   ============================================================ */
const tooltipEl = document.getElementById('tooltip')
const ttTitle = document.getElementById('tooltip-title')
const ttMaterial = document.getElementById('tooltip-material')
const ttFinish = document.getElementById('tooltip-finish')
const ttSpec = document.getElementById('tooltip-spec')

const showTooltip = (x, y, index) => {
    const meta = getMeta(index)
    ttTitle.textContent = state.parts[index]?.mesh.name || meta.category
    ttMaterial.textContent = meta.material
    ttFinish.textContent = meta.finish
    ttSpec.textContent = meta.spec

    // Clamp tooltip to screen edges
    const tw = 275, th = 110
    const tx = Math.min(x + 16, sizes.width - tw - 10)
    const ty = Math.min(y + 16, sizes.height - th - 10)
    tooltipEl.style.left = tx + 'px'
    tooltipEl.style.top = ty + 'px'
    tooltipEl.classList.add('visible')
}

const hideTooltip = () => tooltipEl.classList.remove('visible')

/* ============================================================
   SMART EXPLOSION DIRECTION
   Vanity parts expand: drawers → front Z, cabinet shells → Y & Z,
   countertop → up, sink → up, mirror → up-back, toe kick → down-Z
   ============================================================ */
const computeExplosionDirection = (mesh, modelCenter, bbox) => {
    const partCenter = new THREE.Vector3()
    if (mesh.geometry.boundingBox) {
        mesh.geometry.boundingBox.getCenter(partCenter)
        partCenter.add(mesh.position)
    } else {
        mesh.getWorldPosition(partCenter)
    }

    const modelSize = new THREE.Vector3()
    bbox.getSize(modelSize)

    // Relative position from model center
    const rel = partCenter.clone().sub(modelCenter)

    // Normalise per axis for direction tendency
    const nx = rel.x / (modelSize.x * 0.5 + 0.001)
    const ny = rel.y / (modelSize.y * 0.5 + 0.001)
    const nz = rel.z / (modelSize.z * 0.5 + 0.001)

    // Parts at top (high Y): mirror, countertop → push up + forward
    // Parts at front (high Z): doors, drawers → push forward
    // Parts at bottom: toe kick, base → push down
    // Parts on sides → push outward

    // Primary direction: outward from centroid, with a slight upward bias for furniture
    const dir = new THREE.Vector3(
        nx * 0.55,
        ny * 0.75 + 0.08,  // slight global upward bias
        nz * 0.65
    )

    // If near center horizontally but near top → push strongly upward
    if (Math.abs(nx) < 0.25 && ny > 0.5) {
        dir.y += 0.3
    }

    // If near center and near front → push forward
    if (Math.abs(nx) < 0.35 && nz > 0.4) {
        dir.z += 0.25
    }

    // Ensure minimum length so even centered parts move
    if (dir.length() < 0.15) {
        dir.set(0, ny >= 0 ? 0.3 : -0.3, 0.2)
    }

    dir.normalize()

    // Scale: spread is proportional to model size so larger models expand proportionally
    const spreadFactor = Math.max(modelSize.x, modelSize.y, modelSize.z) * 0.45
    dir.multiplyScalar(spreadFactor)

    return dir
}

/* ============================================================
   MATERIAL BUILDER — preserve original materials but enhance them
   ============================================================ */
const enhanceMaterial = (mat, index) => {
    if (!mat) return mat

    // Enhance existing materials rather than replace
    if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
        mat.envMapIntensity = 1.6
        if (!mat.isMeshPhysicalMaterial) {
            // Upgrade to Physical for clearcoat
            return new THREE.MeshPhysicalMaterial({
                map: mat.map,
                normalMap: mat.normalMap,
                roughnessMap: mat.roughnessMap,
                metalnessMap: mat.metalnessMap,
                color: mat.color,
                metalness: mat.metalness,
                roughness: mat.roughness,
                envMapIntensity: 1.6,
                clearcoat: 0.15,
                clearcoatRoughness: 0.35,
            })
        }
        mat.clearcoat = Math.max(mat.clearcoat ?? 0, 0.15)
        mat.clearcoatRoughness = Math.min(mat.clearcoatRoughness ?? 1, 0.4)
        return mat
    }

    // Fallback: if unlit or basic → give premium PBR
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0.08, 0.15, 0.55 - (index % 6) * 0.04),
        metalness: 0.1,
        roughness: 0.55,
        envMapIntensity: 1.4,
        clearcoat: 0.2,
        clearcoatRoughness: 0.4,
    })
}

/* ============================================================
   MODEL LOAD
   ============================================================ */
const gltfLoader = new GLTFLoader()
const modelUrl = '/models/Vanity_V2_Animated.glb'

setLoadProgress(10, 'Fetching vanity geometry...')

gltfLoader.load(
    modelUrl,
    (gltf) => {
        setLoadProgress(80, 'Processing model...')

        const model = gltf.scene
        state.model = model

        const bbox = new THREE.Box3().setFromObject(model)
        const center = bbox.getCenter(new THREE.Vector3())
        const size = bbox.getSize(new THREE.Vector3())
        state.maxDim = Math.max(size.x, size.y, size.z)

        // --- Deep Hierarchy Log ---
        console.log('[Vanity Debug] Full hierarchy:')
        model.traverse(n => {
            console.log(`  - ${n.name} [${n.type}]`)
            if (n.isMesh) {
                console.log(`    Geometry: ${n.geometry.attributes.position.count} vertices, ${n.geometry.groups?.length || 0} groups`)
            }
        })

        // Center
        model.position.sub(center)
        scene.add(model)

        // Camera fit
        const maxDim = Math.max(size.x, size.y, size.z)
        const fovRad = camera.fov * (Math.PI / 180)
        const dist = (maxDim / 2 / Math.tan(fovRad / 2)) * 2.6
        camera.position.set(dist * 0.65, dist * 0.45, dist)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()
        state._cameraDefaultPos = camera.position.clone()

        // Collect meshes
        const meshes = []
        model.traverse((child) => {
            if (child.isMesh) {
                child.geometry.computeVertexNormals()
                child.castShadow = true
                child.receiveShadow = true
                meshes.push(child)
            }
        })

        setLoadProgress(88, 'Enhancing materials...')

        // Sort by world-Y descending (top parts first in sidebar)
        meshes.sort((a, b) => {
            const wa = new THREE.Vector3(), wb = new THREE.Vector3()
            a.getWorldPosition(wa); b.getWorldPosition(wb)
            return wb.y - wa.y
        })

        // Re-compute bbox after centering for direction calc
        const centeredBBox = new THREE.Box3().setFromObject(model)
        const centeredCenter = centeredBBox.getCenter(new THREE.Vector3())

        const total = meshes.length
        meshes.forEach((child, index) => {
            // Enhance original material(s)
            if (Array.isArray(child.material)) {
                child.material = child.material.map((m, mi) => enhanceMaterial(m, index + mi))
            } else {
                child.material = enhanceMaterial(child.material, index)
            }

            // Compute explosion direction
            child.geometry.computeBoundingBox()
            const dir = computeExplosionDirection(child, centeredCenter, centeredBBox)

            state.parts.push({
                mesh: child,
                initialPos: child.position.clone(),
                direction: dir,
                index,
            })
        })

        setLoadProgress(95, 'Building interface...')

        buildPartsList()
        createInfoButtons()

        setLoadProgress(100, 'Ready.')

        setTimeout(() => {
            hideLoadingScreen()
            state.modelLoaded = true

            // Cinematic intro: slow reveal explosion then partial collapse
            setTimeout(() => {
                const tl = gsap.timeline()

                // Step 1: subtle tilt
                tl.to(state.model.rotation, {
                    x: 0.03, y: 0.08,
                    duration: 1.2, ease: 'power1.inOut'
                })

                // Step 2: explode to 30%
                tl.to(state, {
                    explosionFactor: 0.30,
                    duration: 4.0,
                    ease: 'power2.inOut',
                    onUpdate: () => setExplosionFactor(state.explosionFactor),
                }, '-=0.6')

                // Step 3: additional tilt while exploded
                tl.to(state.model.rotation, {
                    x: -0.04, y: -(12 * Math.PI) / 180,
                    duration: 1.8, ease: 'power1.inOut'
                }, '+=0.3')

            }, 700)

        }, 400)
    },
    (progress) => {
        if (progress.total > 0) {
            const pct = 10 + (progress.loaded / progress.total) * 68
            setLoadProgress(pct, 'Downloading model...')
        }
    },
    (error) => {
        console.error('GLTF load error:', error)
        loadingText.textContent = 'Error loading model.'
        loadingBar.style.background = '#ff4444'
    }
)

/* ============================================================
   POINTER — raycasting for hover tooltip
   ============================================================ */
let lastPointerX = 0, lastPointerY = 0

window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / sizes.width) * 2 - 1
    pointer.y = -(e.clientY / sizes.height) * 2 + 1
    lastPointerX = e.clientX
    lastPointerY = e.clientY
})

/* ============================================================
   CLICK — select part on 3D click
   ============================================================ */
canvas.addEventListener('click', () => {
    if (!state.modelLoaded) return
    raycaster.setFromCamera(pointer, camera)
    const meshObjs = state.parts.map(p => p.mesh)
    const hits = raycaster.intersectObjects(meshObjs, true)
    if (hits.length > 0) {
        const hitMesh = hits[0].object
        const idx = state.parts.findIndex(p => p.mesh === hitMesh || p.mesh.getObjectById(hitMesh.id))
        if (idx !== -1) focusOnPart(idx)
    }
})

/* ============================================================
   RENDER LOOP
   ============================================================ */
const clock = new THREE.Clock()

const tick = () => {
    const elapsed = clock.getElapsedTime()

    controls.update()

    // Animate warm point light for living reflections
    warmPoint.position.x = Math.sin(elapsed * 0.22) * 4 - 2
    warmPoint.position.z = Math.cos(elapsed * 0.22) * 4 + 2
    coolPoint.position.x = Math.cos(elapsed * 0.18) * 3 + 3
    coolPoint.position.y = Math.sin(elapsed * 0.14) * 1.5 + 7

    // Hover raycasting for tooltip
    if (state.modelLoaded) {
        raycaster.setFromCamera(pointer, camera)
        const meshObjs = state.parts.map(p => p.mesh)
        const hits = raycaster.intersectObjects(meshObjs, true)

        if (hits.length > 0) {
            const hitMesh = hits[0].object
            const idx = state.parts.findIndex(p => p.mesh === hitMesh)
            if (idx !== -1 && idx !== state.hoveredPart) {
                if (state.hoveredPart !== null && state.hoveredPart !== state.activePart) {
                    highlightPart(state.hoveredPart, false)
                }
                state.hoveredPart = idx
                if (state.hoveredPart !== state.activePart) {
                    highlightPart(state.hoveredPart, true)
                }
            }
            if (idx !== -1) showTooltip(lastPointerX, lastPointerY, idx)
        } else {
            if (state.hoveredPart !== null) {
                if (state.hoveredPart !== state.activePart) highlightPart(state.hoveredPart, false)
                state.hoveredPart = null
                hideTooltip()
            }
        }

        updateLabels()
    }

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()
