import { useGLTF } from "@react-three/drei";

type ModelProps = {
  url: string;
};

export default function Scene({ url }: ModelProps) {
  const { scene } = useGLTF(url);

  return <primitive object={scene} />;
}
