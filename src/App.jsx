import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"

function App() {

  return (
    <>
      <Canvas camera={{
            position: [-4, 3, 6]
          }}
        >
          <color attach="background" args={['#333333']} />
        <OrbitControls />
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]}/>
          <meshNormalMaterial />
        </mesh>
      </Canvas>
    </>
  )
}

export default App
