"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";

function Model() {
  const { scene } = useGLTF(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf"
  );
  return <primitive object={scene} />;
}

export default function Asset() {
  return (
    <div className="aspect-auto h-screen">
      <Canvas>
        <OrbitControls enableDamping enablePan enableRotate enableZoom />
        <Environment
          files="https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/pedestrian_overpass_1k.hdr"
          background
        />
        <ambientLight />
        <Model />
      </Canvas>
    </div>
  );
}
