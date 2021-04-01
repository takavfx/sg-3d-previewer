'use strict'
const querystring = require('querystring')
const THREE = require('three')
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper'

import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import Stats from 'three/examples/jsm/libs/stats.module'

import { baseUrl, credentialParams } from './env'
import './style/index.scss'
import { EquirectangularReflectionMapping } from 'three'

const parse = querystring.parse

const extGltfArray = ["gltf", "glb"]
const extFbxArray = ["fbx"]

const envMaps = {
    default: '',
    pedestrian_overpass_1k: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/pedestrian_overpass_1k.hdr',
    royal_esplanade_1k: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/royal_esplanade_1k.hdr',
    quarry_01_1k: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/quarry_01_1k.hdr',
    venice_sunset_1k: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/venice_sunset_1k.hdr',
}


function preview (token, versions=[], envmap=0) {
    const canvas = document.querySelector('#canvas')
    
    // Prepare for animation
    let mixer, stats
    const clock = new THREE.Clock()

    // Manage Shotgun info to use in this app
    console.log(versions)
    let versionsList = []
    for (let i = 0; i < versions.length; i++) {
        versionsList.push(versions[i]['name'])
    }
    console.log(versionsList)

    // Parameters exposed in GUI
    let AxisState, GridState, StatsState
    if (localStorage.getItem('Axis')) {AxisState=localStorage.getItem('Axis')} else {AxisState=false}
    if (localStorage.getItem('Grid')) {GridState=localStorage.getItem('Grid')} else {GridState=false}
    if (localStorage.getItem('Stats')) {StatsState=localStorage.getItem('Stats')} else {StatsState=false}
    
    let params = {
        Version: versionsList[0],
        EnvMap: Object.keys(envMaps)[envmap],
        TimeScale: 1,
        Axis: toBoolean(AxisState),
        Grid: toBoolean(GridState),
        Stats: toBoolean(StatsState),
    }
    
    // Stats
    let StatsStateAsInt
    if (toBoolean(StatsState)) {StatsStateAsInt=0} else {StatsStateAsInt=-1}
    stats = new Stats()
    stats.showPanel(StatsStateAsInt)
    document.body.appendChild(stats.dom)


    // Renderer settings
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: canvas,
    })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.physicallyCorrectLights = true
    renderer.setSize( window.innerWidth, window.innerHeight )


    // Create Scene
    const scene = new THREE.Scene('')


    // Create Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
    camera.position.set(0, 3, 5)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.update()

    // Create Heloper
    let axis = new THREE.AxesHelper()
    let grid = new THREE.GridHelper()
    grid.material.opacity = 0.2
    grid.material.transparent = true
    if (params.Axis) {scene.add(axis)}
    if (params.Grid) {scene.add(grid)}
    
    // Environent Map
    // Create PMREMGenerator object
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    const rgbeLoader = new RGBELoader()
    rgbeLoader.setDataType(THREE.UnsignedByteType)


    // Gui
    let gui = new GUI()
    addGui()

    // Load Environment
    // console.log('EnvMaps', envmap, Object.keys(envMaps)[envmap])
    loadEnvMap(Object.keys(envMaps)[envmap])

    // Load Mdoel
    let fScene, model, animations
    loadModel(versionsList[0])


    function addGui () {

        // Shotgun
        let sgParamsFolder = gui.addFolder('Shotgun')
        sgParamsFolder.add(params, 'Version', versionsList).onChange(function () {
            if (fScene) {
                scene.remove(fScene)
            }
            loadModel(params.Version)
        })
        sgParamsFolder.open()

        // Environemnet
        let envParamsFolder = gui.addFolder('Environment')
        envParamsFolder.add(params, 'EnvMap', Object.keys(envMaps)).onChange(function () {
            loadEnvMap(params.EnvMap)
        })
        envParamsFolder.open()

        // Play
        let playParamsFolder = gui.addFolder('Play')
        playParamsFolder.add(params, 'TimeScale', -1, 2).onChange(function () {
            for (let i=0;i<animations.length;i++) {
                let animation = animations[i]
                let action = mixer.clipAction(animation)
                action.timeScale = params.TimeScale
            }
        })
        playParamsFolder.open()

        // Utility
        let utilParamsFolder = gui.addFolder('Utility')
        utilParamsFolder.add(params, 'Axis', true).onChange(function () {
            if (params.Axis) {
                scene.add(axis)
                localStorage.setItem('Axis', true)
            } else {
                scene.remove(axis)
                localStorage.setItem('Axis', false)
            }
        })
        utilParamsFolder.add(params, 'Grid', true).onChange(function () {
            if (params.Grid) {
                scene.add(grid)
                localStorage.setItem('Grid', true)
            } else {
                scene.remove(grid)
                localStorage.setItem('Grid', false)
            }
        })
        utilParamsFolder.add(params, 'Stats', true).onChange(function () {
            if (params.Stats) {
                stats.showPanel(0)
                localStorage.setItem('Stats', true)
            } else {
                stats.showPanel(-1)
                localStorage.setItem('Stats', false)
            }
        })
        // utilParamsFolder.open()
    }


    function loadEnvMap (envMapName) {
        if (envMapName==='default') {
            rgbeLoader.load(
                envMaps[Object.keys(envMaps)[1]],
                function (texture) {
                    let envMap = pmremGenerator.fromEquirectangular(texture).texture
        
                    scene.background = new THREE.Color('#696969')
                    scene.environment = envMap

                    texture.dispose()
                    pmremGenerator.dispose()
                }
            )
        } else {
            rgbeLoader.load(
                envMaps[envMapName],
                function (texture) {
                    let envMap = pmremGenerator.fromEquirectangular(texture).texture
                    
                    scene.background = envMap
                    scene.environment = envMap
                    
                    texture.dispose()
                    pmremGenerator.dispose()
                }
            )
        }
    }


    function loadModel (versionStr) {
    
        const roughnessMipmapper = new RoughnessMipmapper(renderer)
        
        let versionId = 0
        for (let i=0;i<versions.length;i++) {
            if (versionStr==versions[i]['name']) {
                versionId = versions[i]['id']
                break
            }
        }
        
        fetch(baseUrl+`/api/v1/entity/versions/${versionId}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `${token['token_type']} ${token['access_token']}`,
                'Accept': 'application/json'
            }
        })
        .then((version_detail_res) => version_detail_res.json())
        .then((version_detail_data) => {
            // console.log(version_detail_data['data'])
            // console.log(version_detail_data['data']['attributes']['sg_preview_geometry']['url'])
            console.log('Got version data ===')
            console.log(version_detail_data)
            let fileUrl = version_detail_data['data']['attributes']['sg_preview_geometry']['url']
            // console.log(fileUrl)
            let ext = fileUrl.substring(fileUrl.lastIndexOf('.') + 1).split('%')[0]
            console.log(ext)
            if (extGltfArray.indexOf(ext) >= 0) {
                console.log('This is gltf file')
                // Create loader
                const dracoLoader = new DRACOLoader()
                const loader = new GLTFLoader()
                loader.setDRACOLoader(dracoLoader)

                loader.load(
                    fileUrl,
                    function (gltf) {
                        console.log(gltf)
                        model = gltf
                        fScene = gltf.scene
                        animations = gltf.animations
                        // console.log(fScene)
                        // console.log(animations)
                        
                        fScene.name = 'loaded fScene'
                        
                        roughnessMipmapper.dispose()
                        
                        scene.add(fScene)

                        mixer = new THREE.AnimationMixer( fScene )
                        for (let i = 0; i < animations.length; i++) {
                            // console.log(i)
                            let animation = animations[i]
                            
                            let action = mixer.clipAction( animation )
                            
                            action.play()
                            animate()
                        }
                    },
                    function (xhr) {
                        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                    },
                    function (err) {
                        console.error('Loading GLTF scene is failed.')
                        console.error(err)
                    }
                )
            }
            else if (extFbxArray.indexOf(ext) >= 0) {
                console.log('This is fbx file')

                const loader = new FBXLoader()

                loader.load(
                    fileUrl,
                    function ( fbx ) {
                        console.log( fbx )
                        fScene = model = fbx
                        animations = model.animations
                        roughnessMipmapper.dispose()

                        fScene.traverse( function(child) {
                            if ( child.isMesh ) {
                                child.castShadow = true
                                child.receiveShadow = true
                                let stdMat = new THREE.MeshStandardMaterial({
                                    color: new THREE.Color(child.material.color)
                                })
                                stdMat.skinning = true
                                child.material = stdMat
                            }
                        })
                        
                        scene.add( fScene )
                        
                        // console.log(fScene.animations.length)
                        mixer = new THREE.AnimationMixer( fScene )
                        for (let i = 0; i < animations.length; i++) {
                            // console.log(i)
                            let animation = animations[i]
                            
                            let action = mixer.clipAction( animation )
                            
                            action.play()
                            animate()
                        }
                        
                    },
                    function (xhr) {
                        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                    },
                    function (err) {
                        console.error('Loading FBX scene is failed.')
                        console.error(err)
                    }
                )
            }

        })
        .catch((err)=> {
            console.error('Accessing to data resource is failed.')
            console.error(err)
            console.error('Please reload this page.')
        })
    }


    function onDocumentKeyDown (event) {
        let keyCode = event.code
        // console.log(event)
        // console.log(event.code)
        if (keyCode == 'Space') {
            if (clock.running) {
                clock.stop()
            } else {
                clock.start()
            }
        }
        if (keyCode == 'KeyG') {
            camera.position.set(0, 3, 5)
        }
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
        stats.update()
    }

    render()
    
    window.addEventListener('resize', onResize)
    document.addEventListener("keydown", onDocumentKeyDown, false)
}


function makeUrl (url, params) {
    let paramsstr = ""
    for (let i = 0; i < Object.keys(params).length; i++) {
        if (i!=0) {
            paramsstr += "&" + Object.keys(params)[i] + "=" + params[Object.keys(params)[i]] 
        } else {
            paramsstr += Object.keys(params)[i] + "=" + params[Object.keys(params)[i]] 
        }
    }
    return url + paramsstr
}


function toBoolean (data='') {
    // console.log(typeof(data))
    if (typeof(data) === 'boolean') {
        return data
    }
    return data === 'true'
}


window.addEventListener('DOMContentLoaded', () => {
    let query = parse(location.search.split('?')[1])
    console.log(query)
    
    console.log("Get credential token ===")
    fetch(makeUrl(baseUrl+'/api/v1/auth/access_token/?', credentialParams), {
        method: 'post',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    })
    .then(
        (at_res) => at_res.json()
    )
    .then(
        (at_data) => {
        console.log(at_data)
        console.log("Get Asset info ===")
        fetch(baseUrl+`/api/v1/entity/assets/${query['assetId']}/relationships/sg_versions?field['']`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `${at_data['token_type']} ${at_data['access_token']}`,
                    'Accept': 'application/json'
                }
            }
        )
        .then((version_res) => version_res.json())
        .then((version_data) => {
            // console.log(version_data['data'])
            preview(at_data, version_data['data'], query['envmap'])
        })
    })
})

