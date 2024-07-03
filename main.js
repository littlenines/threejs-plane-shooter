import './style.css'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three'

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x009fbd );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#app'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);


const light = new THREE.AmbientLight( 0xffffff );
scene.add( light );

const loader = new GLTFLoader();

const asyncPlane = loader.loadAsync('./foam_rc_plane2.glb')
let PlaneM = await asyncPlane;
let planeModel = PlaneM.scene;

planeModel.position.x = 2;
planeModel.rotation.x = 1.5;
planeModel.position.y = -1.6
scene.add(planeModel);

camera.position.z = 4;

const mouse = new THREE.Vector2();
document.addEventListener('mousemove', onMouseMove);

function onMouseMove(event) {
  // Update the mouse x-coordinate
  if (planeModel) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;

  // Convert screen coordinates to world position
  const vector = new THREE.Vector3(mouse.x, 0, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));

  // Set the model position (only update the x-coordinate)
  planeModel.position.x = pos.x;
  }
}

document.addEventListener('mousedown', onMouseDown);

const bullets = [];
const circles = [];

function onMouseDown(event) {
  // Get mouse coordinates
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Create a cylinder (bullet)
  const cylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 10);
  const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const bullet = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

  // Set bullet position to sphere's position
  bullet.position.copy(planeModel.position);

  // Add bullet to scene
  scene.add(bullet);
  bullets.push(bullet);

  // Animate the bullet (move it vertically)
  const targetY = 10; // Adjust the desired height
  const duration = 1000; // Animation duration in milliseconds
  const initialY = planeModel.position.y + 0.8;
  const startTime = Date.now();

  function animateBullet() {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const newY = initialY + (targetY - initialY) * progress;
    bullet.position.y = newY;

    if (progress < 1) {
      requestAnimationFrame(animateBullet);
    } else {
      // Remove the bullet when animation is complete
      scene.remove(bullet);
      const index = bullets.indexOf(bullet);
      if (index > -1) {
        bullets.splice(index, 1);
      }
    }
  }

  animateBullet();
}

// circles
function spawnFallingCircle() {
  // Create a circle
  const circleGeometry = new THREE.CircleGeometry(0.1, 32);
  const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const circle = new THREE.Mesh(circleGeometry, circleMaterial);

  // Set initial position (random x, top of the screen)
  circle.position.x = (Math.random() - 0.5) * 2 * (window.innerWidth / window.innerHeight);
  circle.position.y = camera.position.y + camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  // Add circle to the scene
  scene.add(circle);
  circles.push(circle);

  // Animate the circle falling downwards
  const duration = 3000; // Duration in milliseconds
  const startTime = Date.now();

  function animateCircle() {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = elapsed / duration;

    if (progress < 1) {
      // Update position
      circle.position.y -= 0.01; // Adjust the speed of falling
      requestAnimationFrame(animateCircle);
    } else {
      // Remove the circle when it reaches the bottom
      scene.remove(circle);
      const index = circles.indexOf(circle);
      if (index > -1) {
        circles.splice(index, 1);
      }
    }
  }

  animateCircle();
}

// Spawn circles at regular intervals
setInterval(spawnFallingCircle, 500);

function checkCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    for (let j = circles.length - 1; j >= 0; j--) {
      const circle = circles[j];
      const distance = bullet.position.distanceTo(circle.position);
      if (distance < 0.15) { 
        scene.remove(circle);
        scene.remove(bullet);
        circles.splice(j, 1);
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

function animate() {
  checkCollisions();
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );