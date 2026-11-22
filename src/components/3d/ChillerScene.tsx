import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

export function ChillerScene() {
  return (
    <div className="h-96 w-full">
      <Canvas
        shadows
        camera={{ position: [5, 3, 5], fov: 38 }}
        style={{ background: "#f5f5f0" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 8, 6]} intensity={1.1} castShadow />
        <directionalLight position={[-4, 4, -4]} intensity={0.35} />

        <group position={[0, 0, 0]}>
          {/* base frame */}
          <mesh position={[0, -1.05, 0]} receiveShadow castShadow>
            <boxGeometry args={[4.4, 0.2, 2.0]} />
            <meshStandardMaterial color="#4b5563" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* vibration feet */}
          {[-1.8, 1.8].map((x) =>
            [-0.8, 0.8].map((z) => (
              <mesh key={`${x}-${z}`} position={[x, -1.25, z]} castShadow>
                <cylinderGeometry args={[0.08, 0.1, 0.2, 12]} />
                <meshStandardMaterial color="#1f2937" roughness={0.8} />
              </mesh>
            ))
          )}

          {/* main housing */}
          <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.0, 1.3, 1.8]} />
            <meshStandardMaterial color="#d1d5db" roughness={0.5} metalness={0.2} />
          </mesh>

          {/* top panel */}
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.1, 0.15, 1.9]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.4} metalness={0.3} />
          </mesh>

          {/* condenser coils on left side */}
          {Array.from({ length: 14 }).map((_, i) => (
            <mesh key={`coil-l-${i}`} position={[-2.05, -0.6 + i * 0.09, 0]} castShadow>
              <boxGeometry args={[0.08, 0.06, 1.6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          {/* condenser coils on right side */}
          {Array.from({ length: 14 }).map((_, i) => (
            <mesh key={`coil-r-${i}`} position={[2.05, -0.6 + i * 0.09, 0]} castShadow>
              <boxGeometry args={[0.08, 0.06, 1.6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}

          {/* protective grilles on sides */}
          <mesh position={[-2.12, -0.1, 0]} castShadow>
            <boxGeometry args={[0.05, 1.2, 1.7]} />
            <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[2.12, -0.1, 0]} castShadow>
            <boxGeometry args={[0.05, 1.2, 1.7]} />
            <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.4} />
          </mesh>

          {/* front service panel */}
          <mesh position={[0, -0.3, 0.95]} castShadow>
            <boxGeometry args={[3.6, 0.9, 0.05]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.5} />
          </mesh>
          {/* panel lines */}
          {[ -1.2, 0, 1.2 ].map((x) => (
            <mesh key={x} position={[x, -0.3, 0.98]} castShadow>
              <boxGeometry args={[0.02, 0.85, 0.02]} />
              <meshStandardMaterial color="#9ca3af" />
            </mesh>
          ))}

          {/* compressor (cylinder) */}
          <mesh position={[-1.2, -0.35, -0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.9, 24]} />
            <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* compressor end caps */}
          <mesh position={[-1.2, -0.35, -0.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.05, 24]} />
            <meshStandardMaterial color="#374151" roughness={0.5} />
          </mesh>
          <mesh position={[-1.2, -0.35, 0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.05, 24]} />
            <meshStandardMaterial color="#374151" roughness={0.5} />
          </mesh>

          {/* refrigerant pipes */}
          <mesh position={[-0.6, -0.2, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.2, 12]} />
            <meshStandardMaterial color="#b45309" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.4, -0.1, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.0, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* top fans (two rows of 3) */}
          {[-1.2, 0, 1.2].map((x) =>
            [-0.45, 0.45].map((z) => (
              <group key={`${x}-${z}`} position={[x, 0.7, z]}>
                {/* fan housing */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.35, 0.35, 0.12, 32]} />
                  <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.4} />
                </mesh>
                {/* fan grille */}
                <mesh position={[0, 0.07, 0]} castShadow>
                  <cylinderGeometry args={[0.33, 0.33, 0.02, 32]} />
                  <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.3} />
                </mesh>
                {/* fan blades (4) */}
                {[0, 1, 2, 3].map((i) => (
                  <mesh key={i} position={[0, 0.05, 0]} rotation={[0, (i * Math.PI) / 2, 0]} castShadow>
                    <boxGeometry args={[0.3, 0.02, 0.08]} />
                    <meshStandardMaterial color="#111827" roughness={0.7} />
                  </mesh>
                ))}
                {/* hub */}
                <mesh position={[0, 0.06, 0]} castShadow>
                  <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
                  <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
                </mesh>
              </group>
            ))
          )}
        </group>

        <OrbitControls enablePan={false} minDistance={4} maxDistance={12} />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}