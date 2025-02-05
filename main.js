import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Setup scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = false;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(0, 5, 5);
scene.add(pointLight);

ambientLight.intensity = 1;
directionalLight.intensity = 2;

const groundSize = 100;
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x959c99,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Load car model
let car;
const loader = new GLTFLoader();
loader.load(
  "car.glb",
  (gltf) => {
    car = gltf.scene;
    car.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    car.position.y = -1.8;
    scene.add(car);
  },
  undefined,
  (error) => {
    console.error("Error loading model:", error);
  }
);

// Movement controls
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

document.addEventListener("keydown", (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = true;
  }
});

document.addEventListener("keyup", (event) => {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = false;
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (car) {
    const speed = 0.2;
    const rotationSpeed = 0.05;
    const boundary = groundSize / 2 - 1; // Limit movement within ground area

    let newX = car.position.x;
    let newZ = car.position.z;

    // Forward & Backward (Z-axis)
    if (keys.w) {
      newX += Math.sin(car.rotation.y) * speed;
      newZ += Math.cos(car.rotation.y) * speed;
    }
    if (keys.s) {
      newX -= Math.sin(car.rotation.y) * speed;
      newZ -= Math.cos(car.rotation.y) * speed;
    }

    // Left & Right Rotation (Y-axis) only when moving
    if (keys.w || keys.s) {
      if (keys.a) {
        car.rotation.y += rotationSpeed;
      }
      if (keys.d) {
        car.rotation.y -= rotationSpeed;
      }
    }

    // Collision detection for boundaries
    if (Math.abs(newX) <= boundary && Math.abs(newZ) <= boundary) {
      car.position.x = newX;
      car.position.z = newZ;
    }

    // Camera follows the car from behind
    const cameraOffset = new THREE.Vector3(0, 7, -6); // Position behind the car
    const cameraPosition = cameraOffset.clone().applyMatrix4(car.matrixWorld);
    camera.position.lerp(cameraPosition, 0.1); // Smooth transition
    camera.lookAt(car.position);
  }

  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
