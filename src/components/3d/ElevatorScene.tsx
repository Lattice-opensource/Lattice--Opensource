import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

const slate = "#64748b";
const glass = "#93c5fd";

export function ElevatorScene() {
  return (
    <div className="h-80 w-full">
      <Canvas
        shadows
        camera={{ position: [4, 3, 4], fov: 40 }}
        style={{ background: "#f5f5f0" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
        <directionalLight position={[-4, 4, -4]} intensity={0.3} />

        <group position={[0, 0, 0]}>
          {/* base platform */}
          <mesh position={[0, -1.6, 0]} receiveShadow castShadow>
            <boxGeometry args={[2.6, 0.25, 2.2]} />
            <meshStandardMaterial color="#6b7280" roughness={0.7} />
          </mesh>

          {/* interior back wall */}
          <mesh position={[0, 0.4, -0.9]} castShadow receiveShadow>
            <boxGeometry args={[2.0, 3.0, 0.15]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
          </mesh>

          {/* interior side walls */}
          <mesh position={[-0.95, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.15, 3.0, 2.0]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
          </mesh>
          {/* side frame */}
          <mesh position={[-0.95, 0.4, 0]} castShadow>
            <boxGeometry args={[0.12, 3.0, 2.0]} />
            <meshStandardMaterial color={slate} roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0.95, 0.4, 0]} castShadow>
            <boxGeometry args={[0.12, 3.0, 2.0]} />
            <meshStandardMaterial color={slate} roughness={0.5} metalness={0.3} />
          </mesh>

          {/* floor */}
          <mesh position={[0, -1.45, 0]} receiveShadow>
            <boxGeometry args={[2.0, 0.1, 2.0]} />
            <meshStandardMaterial color="#d1d5db" roughness={0.4} metalness={0.1} />
          </mesh>

          {/* thick front-left pillar */}
          <mesh position={[-0.9, 0.4, 0.9]} castShadow>
            <boxGeometry args={[0.25, 3.0, 0.25]} />
            <meshStandardMaterial color={slate} roughness={0.5} metalness={0.3} />
          </mesh>
          {/* thick front-right pillar */}
          <mesh position={[0.9, 0.4, 0.9]} castShadow>
            <boxGeometry args={[0.35, 3.0, 0.25]} />
            <meshStandardMaterial color={slate} roughness={0.5} metalness={0.3} />
          </mesh>
          {/* top beam front */}
          <mesh position={[0, 1.95, 0.9]} castShadow>
            <boxGeometry args={[2.0, 0.25, 0.25]} />
            <meshStandardMaterial color={slate} roughness={0.5} metalness={0.3} />
          </mesh>
          {/* top beam back */}
          <mesh position={[0, 1.95, -0.9]} castShadow>
            <boxGeometry args={[2.0, 0.25, 0.25]} />
            <meshStandardMaterial color={slate} roughness={0.5} metalness={0.3} />
          </mesh>

          {/* ceiling */}
          <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.0, 0.12, 2.0]} />
            <meshStandardMaterial color={slate} roughness={0.5} metalness={0.3} />
          </mesh>

          {/* left glass panel 1 */}
          <mesh position={[-0.45, 0.4, 0.8]} castShadow>
            <boxGeometry args={[0.9, 2.8, 0.05]} />
            <meshStandardMaterial color={glass} transparent opacity={0.45} roughness={0.1} metalness={0.2} />
          </mesh>
          {/* left glass panel 2 */}
          <mesh position={[0.45, 0.4, 0.8]} castShadow>
            <boxGeometry args={[0.9, 2.8, 0.05]} />
            <meshStandardMaterial color={glass} transparent opacity={0.45} roughness={0.1} metalness={0.2} />
          </mesh>
          {/* glass divider */}
          <mesh position={[0, 0.4, 0.8]} castShadow>
            <boxGeometry args={[0.05, 2.8, 0.08]} />
            <meshStandardMaterial color={slate} roughness={0.5} metalness={0.3} />
          </mesh>



          {/* control panel */}
          <mesh position={[0.85, 0.2, 0.5]} castShadow>
            <boxGeometry args={[0.15, 0.9, 0.05]} />
            <meshStandardMaterial color="#1f2937" roughness={0.4} />
          </mesh>
          {/* buttons */}
          {[0.5, 0.35, 0.2, 0.05, -0.1].map((y, i) => (
            <mesh key={i} position={[0.85, y, 0.53]} castShadow>
              <boxGeometry args={[0.08, 0.08, 0.02]} />
              <meshStandardMaterial color="#6b7280" />
            </mesh>
          ))}
          {/* display */}
          <mesh position={[0.85, 0.62, 0.53]} castShadow>
            <boxGeometry args={[0.1, 0.06, 0.02]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
          </mesh>

          {/* elevator car */}
          <mesh position={[0, -0.6, 0.2]} castShadow>
            <boxGeometry args={[1.6, 0.8, 1.4]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
          </mesh>
          {/* doors */}
          <mesh position={[-0.4, -0.6, 0.9]} castShadow>
            <boxGeometry args={[0.75, 0.75, 0.05]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0.4, -0.6, 0.9]} castShadow>
            <boxGeometry args={[0.75, 0.75, 0.05]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>


        </group>

        <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}