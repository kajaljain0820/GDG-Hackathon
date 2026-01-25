'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, PerspectiveCamera, Sparkles, Stars, Text, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function CameraController() {
  const { camera } = useThree();
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    tl.current = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    });

    if (tl.current) {
      tl.current
        .to(camera.position, { x: 0, y: 0, z: 5, duration: 4, ease: "power2.inOut" }, 'start')
        .to(camera.position, { x: -8, y: 2, z: -5, duration: 4, onUpdate: () => camera.lookAt(-5, 0, -10) }, 'library')
        .to(camera.position, { x: 8, y: 5, z: -15, duration: 4, onUpdate: () => camera.lookAt(5, 0, -20) }, 'lecture')
        .to(camera.position, { x: 0, y: 20, z: -30, duration: 4, onUpdate: () => camera.lookAt(0, 0, -40) }, 'end');
    }

    return () => {
      tl.current?.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [camera]);

  return null;
}

function FloatingGrid() {
  return (
    <group position={[0, -5, 0]}>
      <gridHelper args={[100, 100, 0xcbd5e1, 0xe2e8f0]} />
    </group>
  )
}

function CyberElements() {
  return (
    <group>
      {/* Floating Knowledge Nodes */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1} position={[-5, 5, -5]}>
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[1.5, 0]} />
          <MeshDistortMaterial color="#f472b6" speed={3} distort={0.4} radius={1} />
        </mesh>
      </Float>

      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={1} position={[6, -2, -8]}>
        <mesh castShadow receiveShadow>
          <octahedronGeometry args={[2, 0]} />
          <MeshDistortMaterial color="#818cf8" speed={2} distort={0.2} radius={1} />
        </mesh>
      </Float>

      <Float speed={1} rotationIntensity={0.5} floatIntensity={2} position={[0, 8, -10]}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} />
        </mesh>
      </Float>

      {/* Scattered Cubes */}
      {[...Array(6)].map((_, i) => (
        <Float key={i} speed={0.8} rotationIntensity={1} floatIntensity={0.8} position={[Math.cos(i) * 12, Math.sin(i * 2) * 8, -10 - (i * 2)]}>
          <mesh>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#f472b6" : "#22d3ee"} roughness={0.2} metalness={0.5} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function ThreeScene() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10">
      {/* Dynamic Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/0 via-blue-50/50 to-blue-50/80 z-0 pointer-events-none" />

      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 20]} />
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#4f86f7" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#cf2e2e" />

        <CameraController />
        <FloatingGrid />
        <CyberElements />

        <Sparkles count={100} scale={20} size={4} speed={0.4} opacity={0.6} color="#0f172a" />
        <fog attach="fog" args={['#f0f9ff', 5, 50]} />
      </Canvas>
    </div>
  );
}
