export default function Avatar() {
  return (
    <group position={[-4, 0, -5]} /* tweak to taste */>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 3, 1]} />
        <meshStandardMaterial color="#9aa4b2" />
      </mesh>
    </group>
  );
}
