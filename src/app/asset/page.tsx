"use client";

import { useState, useEffect } from "react";
import { FaGithub } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stats, Grid } from "@react-three/drei";
import { useControls } from "leva";
import { Version, VersionGroup } from "@/lib/shotgrid";
import Scene from "./Scene";

export default function AssetPreview() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionTitles, setVersionTitles] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { Speed, AmbLightCol, AmbLightInt } = useControls({
    Speed: { value: 1, min: -1, max: 2, step: 0.1 },
    AmbLightCol: "white",
    AmbLightInt: { value: 0, min: 0, max: 100, step: 1 },
  });

  const utilityCtrls = useControls("Utilities", {
    ShowStats: { value: false, label: "Stats" },
    ShowGrid: { value: false, label: "Grid" },
    ShowAxis: { value: false, label: "Axis" },
  });

  useEffect(() => {
    fetch(`/api/versions?assetId=${id}`)
      .then((res) => {
        return res.json();
      })
      .then((vers: VersionGroup) => {
        setVersions(vers.versions.data);

        let newVersionTitles = vers.versions.data.map((version) => {
          return version.name;
        });
        console.log(newVersionTitles);

        setVersionTitles(newVersionTitles);
      });
  }, [assetId]);

  const url =
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf";

  return (
    <div className="aspect-auto h-screen">
      <a
        href="https://github.com/takavfx/sg-3d-previewer"
        className="absolute z-10 bottom-0 p-2"
      >
        <FaGithub size={24} />
      </a>
      <Canvas>
        <OrbitControls enableDamping enablePan enableRotate enableZoom />
        <Environment
          files="https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/pedestrian_overpass_1k.hdr"
          background
        />
        <ambientLight color={AmbLightCol} intensity={AmbLightInt} />
        <Scene url={url} />
        {utilityCtrls.ShowStats ? <Stats /> : <></>}
        {utilityCtrls.ShowGrid ? (
          <Grid sectionColor={"#9d4b4b"} cellColor={"#6f6f6f"} infiniteGrid />
        ) : (
          <></>
        )}
      </Canvas>
    </div>
  );
}
