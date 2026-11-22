import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Environment } from "@react-three/drei";

interface DeviceSceneProps {
  variant?: string;
}

export function DeviceScene({ variant = "chiller" }: DeviceSceneProps) {
  const color = variant.includes("fridge")
    ? "#94a3b8"
    : variant.includes("induction")
      ? "#a78bfa"
      : "#cbd5e1";

  return (
    <div className="h-72 w-full">
      <Canvas camera={{ position: [3, 2, 3], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Box args={[2, 1, 1]} position={[0, 0, 0]}>
          <meshStandardMaterial color={color} />
        </Box>
        {/* red problem marker */}
        <mesh position={[0.6, 0.2, 0.55]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" />
        </mesh>
        <OrbitControls enablePan={false} />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}