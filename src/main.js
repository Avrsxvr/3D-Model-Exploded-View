import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import gsap from 'gsap'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/* ============================================================
   UTILITY — clamp
   ============================================================ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

/* ============================================================
   PART METADATA
   Professional labeling for faucet components
   ============================================================ */
const PART_META = [
    { material: 'Zinc Die-Cast Alloy', finish: 'Rose Gold', spec: 'ASTM B86', category: 'Base/Frame' },
    { material: 'Braided Stainless Steel', finish: 'Exposed Steel', spec: 'ASME A112.18.6', category: 'Supply Line' },
    { material: 'Braided Stainless Steel', finish: 'Exposed Steel', spec: 'ASME A112.18.6', category: 'Supply Line' },
    { material: 'Silicone', finish: 'Matte Black', spec: 'FDA Approved', category: 'Gasket' },
    { material: 'Brass Alloy', finish: 'Rose Gold', spec: 'CEN EN 12164', category: 'Fastener' },
    { material: 'ABS Polymer', finish: 'Matte Black', spec: 'ISO 2580', category: 'Structural Inner' },
    { material: 'Ceramic Disc', finish: 'Polished', spec: 'Alumina 95%', category: 'Valve Component' },
    { material: 'EPDM Rubber', finish: 'Matte Black', spec: 'ASTM D1418', category: 'O-Ring Seal' },
    { material: '304 Stainless Steel', finish: 'Rose Gold', spec: 'ASTM A240', category: 'Spacer' },
    { material: 'Brass Alloy', finish: 'Rose Gold', spec: 'CEN EN 12164', category: 'Retainer' },
    { material: 'Copper Alloy', finish: 'Rose Gold', spec: 'ASTM B88', category: 'Mounting Tube' },
    { material: 'PTFE Tape', finish: 'White', spec: 'MIL-T-27730A', category: 'Thread Seal' },
    { material: 'Zinc Alloy', finish: 'Rose Gold', spec: 'ASTM B86', category: 'Nut' },
    { material: 'Brass Alloy', finish: 'Rose Gold', spec: 'CEN EN 12164', category: 'Main Body' },
    { material: 'EPDM Rubber', finish: 'Matte Black', spec: 'ASTM D1418', category: 'O-Ring Seal' },
    { material: 'Brass/Plastic', finish: 'Mixed', spec: 'NSF/ANSI 61', category: 'Cartridge Core' },
    { material: '304 Stainless Steel', finish: 'Rose Gold', spec: 'ASTM A240', category: 'Handle Lever' },
    { material: 'PTFE Tape', finish: 'White', spec: 'ISO 12092', category: 'Thread Seal' },
    { material: 'Copper Alloy', finish: 'Rose Gold', spec: 'CEN EN 1254', category: 'Fitting' },
]

const getMeta = (index) => PART_META[index % PART_META.length]

/* ============================================================
   SCENE SETUP
   ============================================================ */
const canvas = document.getElementById('webgl-canvas')
const scene = new THREE.Scene()

// Light grey background from image
scene.background = new THREE.Color('#d2d2d2')
scene.fog = new THREE.FogExp2(0xd2d2d2, 0.02) // subtle fog matching the bg color

/* ============================================================
   SIZES
   ============================================================ */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

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
const camera = new THREE.PerspectiveCamera(42, sizes.width / sizes.height, 0.01, 200)
camera.position.set(5, 3.5, 7)
scene.add(camera)

/* ============================================================
   RENDERER — premium settings
   ============================================================ */
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.95 // Lowered to prevent blowout
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace

/* ============================================================
   ENVIRONMENT & LIGHTING
   ============================================================ */
const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

// Ambient
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
scene.add(ambientLight)

// Key light
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
keyLight.position.set(8, 10, 8)
keyLight.castShadow = true
keyLight.shadow.mapSize.set(2048, 2048)
keyLight.shadow.camera.near = 0.1
keyLight.shadow.camera.far = 50
keyLight.shadow.camera.top = 15
keyLight.shadow.camera.right = 15
keyLight.shadow.camera.bottom = -15
keyLight.shadow.camera.left = -15
keyLight.shadow.bias = -0.001
scene.add(keyLight)

// Fill light
const fillLight = new THREE.DirectionalLight(0xb0c4ff, 0.4) // softened blue fill
fillLight.position.set(-8, 2, -4)
scene.add(fillLight)

// Rim light (softened for rose gold)
const rimLight = new THREE.DirectionalLight(0x00d4ff, 0.2) // reduced kick
rimLight.position.set(0, -4, -8)
scene.add(rimLight)

// Warm accent
const warmLight = new THREE.PointLight(0xffaa66, 0.6, 30) // lowered intensity
warmLight.position.set(-4, 6, 4)
scene.add(warmLight)


/* ============================================================
   CONTROLS
   ============================================================ */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.minDistance = 0.5
controls.maxDistance = 40
controls.maxPolarAngle = Math.PI * 0.85

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
    maxDim: 2,
}

/* ============================================================
   RAYCASTER & POINTER
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
    // Show the grid overlay when ready
    const grid = document.createElement('div')
    grid.className = 'grid-overlay'
    document.body.insertBefore(grid, canvas)
}


/* ============================================================
   PART HIGHLIGHT
   ============================================================ */
const highlightPart = (index, on) => {
    const part = state.parts[index]
    if (!part) return
    const mesh = part.mesh

    if (on) {
        // Glow emissive
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach(m => {
            if (m && m.emissive !== undefined) {
                m.emissive.setHex(0x003344)
            }
        })
    } else if (state.activePart !== index) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach(m => {
            if (m && m.emissive !== undefined) {
                m.emissive.setHex(0x000000)
            }
        })
    }
}

/* ============================================================
   FOCUS ON PART (camera orbit to look at it)
   ============================================================ */
const focusOnPart = (index) => {
    const part = state.parts[index]
    if (!part) return

    // Update active part
    if (state.activePart !== null) {
        highlightPart(state.activePart, false)
    }

    state.activePart = index
    highlightPart(index, true)

    // Animate camera target to part
    const worldPos = new THREE.Vector3()
    part.mesh.getWorldPosition(worldPos)

    gsap.to(controls.target, {
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
        duration: 0.8,
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
    // Update slider UI (max factor = 1)
    const pct = value * 100
    sliderEl.value = pct
    sliderFill.style.width = pct + '%'
    sliderDisplay.textContent = Math.round(pct) + '%'

    // Show/hide labels based on explosion level
    updateLabels()
}

sliderEl.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100  // 0–1 range
    setExplosionFactor(val)
    // Kill any running animation
    gsap.killTweensOf(state)
    if (state.model) {
        gsap.killTweensOf(state.model.rotation)
        gsap.to(state.model.rotation, { x: 0, y: 0, duration: 0.3 })
    }
})

/* ============================================================
   ANIMATE EXPLOSION BUTTON
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${target === 0 ? '<polygon points="5 3 19 12 5 21 5 3"/>' : '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>'}
        </svg>
        ${label}`
        }
    })

    if (target > 0) {
        // Explode first
        tl.to(state, {
            explosionFactor: target,
            duration: 2.8,
            ease: 'power3.inOut',
            onUpdate: () => setExplosionFactor(state.explosionFactor)
        })
        // Then twist if model is loaded
        if (state.model) {
            tl.to(state.model.rotation, {
                x: Math.PI * 0.08,        // tilt slightly
                y: -(20 * Math.PI) / 180, // twist 20deg
                duration: 1.5,
                ease: 'power2.out'
            }, "+=0.1")
        }
    } else {
        // Untwist first
        if (state.model) {
            tl.to(state.model.rotation, {
                x: 0,
                y: 0,
                duration: 1.5,
                ease: 'power2.inOut'
            })
        }
        // Then collapse
        tl.to(state, {
            explosionFactor: 0,
            duration: 2.8,
            ease: 'power3.inOut',
            onUpdate: () => setExplosionFactor(state.explosionFactor)
        }, ">") // start immediately after untwist
    }
})

/* ============================================================
   RESET BUTTON
   ============================================================ */
const btnReset = document.getElementById('btn-reset')
btnReset.addEventListener('click', () => {
    gsap.killTweensOf(state)
    if (state.model) {
        gsap.killTweensOf(state.model.rotation)
        gsap.to(state.model.rotation, { x: 0, y: 0, duration: 1.4, ease: 'power2.out' })
    }
    gsap.to(state, {
        explosionFactor: 0,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => setExplosionFactor(state.explosionFactor),
        onComplete: () => {
            state.isAnimating = false
            btnExplode.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Explode`
        }
    })
    // Reset camera
    gsap.to(camera.position, {
        x: state._cameraDefaultPos?.x ?? 5,
        y: state._cameraDefaultPos?.y ?? 3.5,
        z: state._cameraDefaultPos?.z ?? 7,
        duration: 1.4,
        ease: 'power2.out',
    })
    // Reset active part
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
btnLabels.classList.add('active')

/* ============================================================
   LEADER LINE LABELS — named parts only, line always tracks part
   ============================================================ */

/**
 * Define the 4 specific parts to label.
 * searchKeywords: case-insensitive substrings to match against mesh.name
 * material: text shown in the dark card on click
 * dx / dy: fixed screen-space offset FROM model center where the number badge sits
 * side: which side the card opens toward
 */
const NAMED_LABELS = [
    {
        searchKeywords: ['lever'],
        displayName: 'Faucet Lever',
        material: '304 Stainless Steel',
        dir3D: new THREE.Vector3(1, 0.8, 0.2), // Top-right forward
        side: 'right'
    },
    {
        searchKeywords: ['body', 'faucet body', 'main body'],
        displayName: 'Faucet Body',
        material: 'Brass Alloy — Rose Gold Finish',
        dir3D: new THREE.Vector3(1.2, -0.2, 0.2), // Mid-right forward
        side: 'right'
    },
    {
        searchKeywords: ['supply', 'tube', 'hose'],
        displayName: 'Supply Tube 01',
        material: 'Braided Stainless Steel',
        dir3D: new THREE.Vector3(-1.2, 0.4, -0.2), // Mid-left back
        side: 'left'
    },
    {
        searchKeywords: ['drain', 'frame', 'base'],
        displayName: 'Drain Frame',
        material: 'Zinc Die-Cast Alloy',
        dir3D: new THREE.Vector3(-1, -0.8, -0.2), // Bottom-left back
        side: 'left'
    },
]

let labelItems = []  // { svgLine, svgDot, numEl, card, mesh, anchorOffset, labelDef, isRight }

// SVG overlay for lines & dots
const labelsSVG = document.getElementById('labels-svg')

/* ─────────────────────────────────────────────────────────────
   ANCHOR MATH — precise geometric center of a mesh in world space
   
   mesh.getWorldPosition() = transform ORIGIN (may not be visual center)
   Instead: bounding-box center in LOCAL space → apply matrixWorld → world space
   ───────────────────────────────────────────────────────────── */
const _localCenter = new THREE.Vector3()
const _worldAnchor = new THREE.Vector3()

const getGeometricCenter = (mesh) => {
    // Ensure matrixWorld is up-to-date (critical during animation)
    mesh.updateWorldMatrix(true, false)

    // Compute local bounding box if not already computed
    if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox()
    }

    // Get center in LOCAL (object) space
    mesh.geometry.boundingBox.getCenter(_localCenter)

    // Transform to WORLD space using the mesh's current matrixWorld
    _worldAnchor.copy(_localCenter).applyMatrix4(mesh.matrixWorld)
    return _worldAnchor.clone()  // return a copy — don't share the scratch vec
}

/* ─────────────────────────────────────────────────────────────
   PROJECT — world-space Vector3 → pixel { x, y, visible }
   ───────────────────────────────────────────────────────────── */
const _ndcVec = new THREE.Vector3()

const projectWorldPoint = (worldPos) => {
    _ndcVec.copy(worldPos).project(camera)
    return {
        x: (_ndcVec.x + 1) * 0.5 * sizes.width,
        y: (-_ndcVec.y + 1) * 0.5 * sizes.height,
        // behind camera if z >= 1
        visible: _ndcVec.z < 1
    }
}

// Keep old alias used by raycasting tooltip elsewhere
const _worldPos = new THREE.Vector3()
const _screenPos = new THREE.Vector3()
const projectToScreen = (mesh) => {
    mesh.getWorldPosition(_worldPos)
    _screenPos.copy(_worldPos).project(camera)
    return {
        x: (_screenPos.x + 1) * 0.5 * sizes.width,
        y: (-_screenPos.y + 1) * 0.5 * sizes.height,
        visible: _screenPos.z < 1
    }
}

/* ─────────────────────────────────────────────────────────────
   KEYWORD SEARCH — case-insensitive substring match on mesh.name
   ───────────────────────────────────────────────────────────── */
const findPartByKeywords = (keywords) => {
    for (const part of state.parts) {
        const n = (part.mesh.name || '').toLowerCase()
        if (keywords.some(kw => n.includes(kw.toLowerCase()))) return part
    }
    return null
}

/* ─────────────────────────────────────────────────────────────
   CREATE LABELS — called once after model loads
   ───────────────────────────────────────────────────────────── */
const createInfoButtons = () => {
    // Remove any existing labels
    labelItems.forEach(({ svgLine, svgDot, numEl, card }) => {
        svgLine?.remove(); svgDot?.remove()
        numEl?.remove(); card?.remove()
    })
    labelItems = []
    labelsSVG.innerHTML = ''

    // ── Log every mesh name so keywords can be verified ──
    console.log('[Labels] mesh names in model:')
    state.parts.forEach((p, i) => console.log(`  [${i}] "${p.mesh.name}"`))

    // ── Sort parts by GEOMETRIC CENTER Y (top → bottom) ──
    // This is more accurate than sorting by transform origin
    const sorted = state.parts.map(p => ({
        part: p,
        cy: getGeometricCenter(p.mesh).y
    })).sort((a, b) => b.cy - a.cy)   // descending: [0]=topmost

    const N = sorted.length

    // Height zones: label 0 → top, label 1 → upper, label 2 → lower, label 3 → bottom
    // Using slightly inset fractions to avoid the very extremities
    const ZONE_FRACTS = [0.05, 0.30, 0.65, 0.90]

    NAMED_LABELS.forEach((labelDef, k) => {
        // 1. Try keyword match first
        let foundPart = findPartByKeywords(labelDef.searchKeywords)
        const method = foundPart ? 'keyword' : 'spatial'

        // 2. Spatial fallback — guaranteed unique zone per label
        if (!foundPart) {
            const idx = Math.min(Math.round(ZONE_FRACTS[k] * (N - 1)), N - 1)
            foundPart = sorted[idx].part
        }

        if (!foundPart) return

        console.log(`[Labels] "${labelDef.displayName}" → "${foundPart.mesh.name}" (${method})`)

        const isRight = labelDef.side === 'right'

        // SVG leader line
        const svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        svgLine.classList.add('leader-line')
        labelsSVG.appendChild(svgLine)

        // Anchor dot — sits at the precise geometric center of the mesh
        const svgDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        svgDot.classList.add('leader-dot')
        svgDot.setAttribute('r', '4')
        labelsSVG.appendChild(svgDot)

        // Number badge ("i")
        const numEl = document.createElement('div')
        numEl.className = 'leader-num'
        numEl.innerHTML = `<i>i</i>`
        numEl.style.opacity = '0'
        numEl.style.pointerEvents = 'none'
        document.body.appendChild(numEl)

        // Dark material info card
        const card = document.createElement('div')
        card.className = `leader-card ${isRight ? 'card-right' : 'card-left'}`
        card.innerHTML = `
            <div class="leader-card-label">${labelDef.displayName}</div>
            <div class="leader-card-text">${labelDef.material}</div>
        `
        card.style.pointerEvents = 'none'
        document.body.appendChild(card)

        // Click badge → toggle card
        numEl.addEventListener('click', (e) => {
            e.stopPropagation()
            const wasOpen = card.classList.contains('open')
            // Close all
            labelItems.forEach(it => {
                it.card.classList.remove('open')
                it.numEl.classList.remove('active')
            })
            if (!wasOpen) {
                card.classList.add('open')
                numEl.classList.add('active')
            }
        })

        labelItems.push({ svgLine, svgDot, numEl, card, mesh: foundPart.mesh, labelDef, isRight })
    })

    // Click anywhere else → close all cards
    document.addEventListener('click', () => {
        labelItems.forEach(it => {
            it.card.classList.remove('open')
            it.numEl.classList.remove('active')
        })
    })
}

/* ─────────────────────────────────────────────────────────────
   UPDATE LABELS — called every frame from tick()
   Anchor = precise geometric center of each mesh in world space,
   projected fresh every frame so lines track the mesh during
   explosion animations AND camera orbits.
   ───────────────────────────────────────────────────────────── */
const updateLabels = () => {
    const factor = state.explosionFactor
    const show = state.labelsVisible && factor > 0.02
    const alpha = clamp((factor - 0.02) / 0.35, 0, 1)
    const alphaStr = alpha.toFixed(3)

    labelItems.forEach(({ svgLine, svgDot, numEl, card, mesh, labelDef, isRight }) => {

        const hide = () => {
            svgLine.style.opacity = '0'
            svgDot.style.opacity = '0'
            numEl.style.opacity = '0'
            numEl.style.pointerEvents = 'none'
            card.classList.remove('open')
            numEl.classList.remove('active')
        }

        if (!show) { hide(); return }

        // ── Step 1: compute EXACT world-space centroid of the mesh ──
        const worldCenter = getGeometricCenter(mesh)

        // ── Step 2: project world → screen (NDC → pixel) ──
        const p = projectWorldPoint(worldCenter)
        if (!p.visible) { hide(); return }

        // ── Step 3: Badge position in true 3D space ──
        // (offset vector rotates identically to the model space)
        const offset = labelDef.dir3D.clone()
        if (state.model) {
            offset.applyQuaternion(state.model.quaternion)
        }
        offset.multiplyScalar(state.maxDim * 0.45)

        const badgeWorldPos = worldCenter.clone().add(offset)
        const bp = projectWorldPoint(badgeWorldPos)
        if (!bp.visible) { hide(); return }

        const bx = bp.x
        const by = bp.y

        // ── Dot precisely at the mesh's geometric center on screen ──
        svgDot.setAttribute('cx', p.x)
        svgDot.setAttribute('cy', p.y)
        svgDot.style.opacity = alphaStr

        // ── Leader line: geometric center → badge ──
        svgLine.setAttribute('x1', p.x)
        svgLine.setAttribute('y1', p.y)
        svgLine.setAttribute('x2', bx)
        svgLine.setAttribute('y2', by)
        svgLine.style.opacity = alphaStr

        // ── Badge ──
        numEl.style.left = bx + 'px'
        numEl.style.top = by + 'px'
        numEl.style.opacity = alphaStr
        numEl.style.pointerEvents = 'auto'

        // ── Card on the outward side of the badge ──
        const cOff = isRight ? 24 : -24
        card.style.left = (bx + cOff) + 'px'
        card.style.top = (by - 8) + 'px'
    })
}






/* ============================================================
   PREMIUM ROSE GOLD MATERIAL
   ============================================================ */
const buildMaterial = (index, total) => {
    // Premium Rose Gold Settings
    return new THREE.MeshPhysicalMaterial({
        color: '#daafa4',            // Richer rose gold
        metalness: 1.0,
        roughness: 0.15,             // Slightly rougher to keep highlights centered
        clearcoat: 0.4,
        clearcoatRoughness: 0.1,
        envMapIntensity: 0.8,        // Lowered to stop reflecting so much of the bright background
    })
}

/* ============================================================
   MODEL LOAD
   ============================================================ */
const gltfLoader = new GLTFLoader()
const modelUrl = '/models/Faucet%20glb.glb'

setLoadProgress(10, 'Loading model geometry...')

gltfLoader.load(
    modelUrl,
    (gltf) => {
        setLoadProgress(80, 'Processing geometry...')

        const model = gltf.scene
        state.model = model

        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        state.maxDim = Math.max(size.x, size.y, size.z)

        // --- Center model ---
        model.position.sub(center)
        scene.add(model)



        // --- Camera fit ---
        const maxDim = Math.max(size.x, size.y, size.z)
        const fovRad = camera.fov * (Math.PI / 180)
        const dist = (maxDim / 2 / Math.tan(fovRad / 2)) * 2.8
        camera.position.set(dist * 0.7, dist * 0.5, dist)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()
        // Store default camera pos for reset
        state._cameraDefaultPos = camera.position.clone()

        // --- Collect & sort meshes ---
        const meshes = []
        model.traverse((child) => {
            if (child.isMesh) {
                child.geometry.computeVertexNormals()
                child.castShadow = true
                child.receiveShadow = true
                meshes.push(child)
            }
        })

        // Sort by Z position (high Z first) — same as original
        meshes.sort((a, b) => b.position.z - a.position.z)

        const total = meshes.length
        meshes.forEach((child, index) => {
            // Apply premium material
            child.material = buildMaterial(index, total)

            // Compute geometry center Z in local space (same as original approach)
            child.geometry.computeBoundingBox()
            const geomCenter = new THREE.Vector3()
            child.geometry.boundingBox.getCenter(geomCenter)

            // Z of the part's geometry center in model space
            const partCenterZ = geomCenter.z + child.position.z

            // Drive explosion purely along Z — small multiplier keeps it subtle
            const zOffset = partCenterZ * 0.04

            state.parts.push({
                mesh: child,
                initialPos: child.position.clone(),
                direction: new THREE.Vector3(0, 0, zOffset),
                index,
            })
        })

        setLoadProgress(95, 'Building UI...')

        createInfoButtons()

        setLoadProgress(100, 'Complete!')

        setTimeout(() => {
            hideLoadingScreen()
            state.modelLoaded = true
            // Stays at 0% — explosion only starts on manual user interaction
        }, 400)
    },
    (progress) => {
        if (progress.total > 0) {
            const pct = 10 + (progress.loaded / progress.total) * 65
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
   POINTER EVENTS — pause auto-rotate on interaction
   ============================================================ */
let lastMoveX = 0
let lastMoveY = 0

window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / sizes.width) * 2 - 1
    pointer.y = -(e.clientY / sizes.height) * 2 + 1
    lastMoveX = e.clientX
    lastMoveY = e.clientY
})



/* ============================================================
   RENDER LOOP
   ============================================================ */
const clock = new THREE.Clock()

const tick = () => {
    const elapsed = clock.getElapsedTime()

    controls.update()



    // Subtle light animation
    warmLight.position.x = Math.sin(elapsed * 0.3) * 5
    warmLight.position.z = Math.cos(elapsed * 0.3) * 5

    // Update SVG labels every frame
    if (state.modelLoaded) updateLabels()

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()
