const THREE = require('three')
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper'

import './style/index.scss'


function preview (modelUrl) {
    
    // const canvas = document.querySelector('#canvas')
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)

    // Prepare for animation
    let mixer = null
    const clock = new THREE.Clock()

    // Renderer settings
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: canvas,
    })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setSize( window.innerWidth, window.innerHeight )

    // Create Scene
    const scene = new THREE.Scene()

    // Create Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
    camera.position.set(-10, 10, 20)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', render)
    controls.update()

    let envMapUrl = './tests/peppermint_powerplant_1k.hdr'
    loadModel()
    // Create Light
    const light1 = new THREE.DirectionalLight(0xffffff)
    light1.position.set(1, 1, 1)
    scene.add(light1)

    const light2 = new THREE.AmbientLight(0xffffff, 0.2)
    // light2.position.set(-1, 1, -1)
    scene.add(light2)


    function loadModel () {
        // Create PMREMGenerator object
        const pmremGenerator = new THREE.PMREMGenerator(renderer)
        pmremGenerator.compileEquirectangularShader()
    
        const rgbeLoader = new RGBELoader()
        rgbeLoader.setDataType(THREE.UnsignedByteType)
        rgbeLoader.load(
            envMapUrl,
            function (texture) {
                console.log(texture)
                let envMap = pmremGenerator.fromEquirectangular(texture).texture
    
                scene.background = envMap
                scene.environment = envMap
    
                texture.dispose()
                pmremGenerator.dispose()

                loadGLTF()
            }
        )
    }


    function loadGLTF () {
        let model = null
    
        const roughnessMipmapper = new RoughnessMipmapper(renderer)
    
        
        // Create loader
        const dracoLoader = new DRACOLoader()
        const loader = new GLTFLoader()
        loader.setDRACOLoader(dracoLoader)
        loader.load(
            modelUrl,
            function (gltf) {
                model = gltf.scene
                // model.scale.set(1, 1, 1)
                // model.position.set(0, 0, 0)
                
                scene.add(gltf.scene)
    
                roughnessMipmapper.dispose()
    
                console.log(gltf.animations[0])
                mixer = new THREE.AnimationMixer(model)
                mixer.clipAction(gltf.animations[0]).play()
    
                animate()
            },
            function (err) {
                console.log(err)
            }
        )
    }


    function onResize () {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    
        renderer.setSize(window.innerWidth, window.innerHeight)
    
        render()
    }
    
    function animate () {
        requestAnimationFrame(animate)
        const delta = clock.getDelta()
        mixer.update(delta)
        controls.update()
        renderer.render(scene, camera)
    }

    function render () {
        requestAnimationFrame(render)
        renderer.render(scene, camera)
    }

    render()
    window.addEventListener('resize', onResize)
}


window.addEventListener('DOMContentLoaded', () => {
    // preview('./tests/Sponza/glTF/Sponza.gltf')
    // preview('./tests/FlightHelmet/glTF/FlightHelmet.gltf')
    // console.log(location.href)
    preview('./tests/BrainStem.gltf')
})

module.exports = preview