"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { FaGithub } from "react-icons/fa";

function Model() {
  const { scene } = useGLTF(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf"
  );
  return <primitive object={scene} />;
}

export default function Asset() {
  return (
    <div className="aspect-auto h-screen">
      <a
        href="https://github.com/takavfx/sg-3d-previewer"
        className="absolute z-10 bottom-0"
      >
        <FaGithub size={24} className="m-2" />
      </a>
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
