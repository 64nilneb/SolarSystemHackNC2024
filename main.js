// main.js

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("button").addEventListener("click", () => {
    document.getElementById("button").style.display = "none";
    document.getElementById("speedModifier").style.display = "flex";
    document.getElementById("introScreen").style.display = "none";
    document.getElementById("toggleOrbits").style.display = "block";
    initializeSolarSystem();
  });
});

// Constants
let speedMultiplier = 0.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.y = 2;

// Create renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); 
scene.add(ambientLight);
// Create stars in the background
function addStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

  const starCount = 10000;
  const starVertices = [];

  for (let i = 0; i < starCount; i++) {
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVertices, 3)
  );
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

//addStars(); // Call the function to add stars
renderer.render(scene, camera);

// Initialize PMREMGenerator
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Load the EXR texture and set it as the background
const exrLoader = new EXRLoader();
exrLoader.load('stars.exr', function (texture) {
    const exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
    scene.background = exrCubeRenderTarget.texture;
    texture.dispose();
});

// Set renderer tone mapping for HDR
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Load textures for the sun and asteroid
const sunTexture = textureLoader.load("textures/sun.jpg");
const asteroidTexture = textureLoader.load("textures/asteroid.jpg");

const sizeMultiplier = 0.1;
// Create a big ball for the sun
const sunGeometry = new THREE.SphereGeometry(1.5 * sizeMultiplier, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Arrays to hold planet meshes and orbits
const planets = [];
const orbits = [];
const labels = []; // Array to hold label elements

let planetData = [];

function initializePlanets() {
  // Create planets and labels
  planetData.forEach((data) => {
    // Load the texture for this planet
    const planetTexture = textureLoader.load(data.texture);

    // Create planet mesh
    const geometry = new THREE.SphereGeometry(
      data.size * sizeMultiplier,
      32,
      32
    );
    const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture, roughness:1,metalness: 0 });
    const planet = new THREE.Mesh(geometry, planetMaterial);
    planet.position.set(data.distance, 0, 0);

    // Store the data in userData
    planet.userData = data;
    scene.add(planet);

    // Compute initial angle in radians
    const initialAngleRad = (data.initialAngleDeg * Math.PI) / 180;

    planets.push({
      planet,
      distance: data.distance,
      speed: data.speed,
      angle: initialAngleRad,
      rotationSpeed: data.rotationSpeed,
    });

    // Create the label as an HTML div
    const labelDiv = document.createElement("div");
    labelDiv.className = "label";
    labelDiv.textContent = data.name;
    labelDiv.style.color = "lightblue";
    labelDiv.style.position = "absolute";
    labelDiv.style.fontFamily = "Poppins";
    labelDiv.style.fontSize = "20px";
    labelDiv.style.pointerEvents = "none";
    labelDiv.style.whiteSpace = "nowrap";
    labelDiv.style.textShadow = "1px 1px 0 black";
    document.body.appendChild(labelDiv);

    labels.push({ planet: planet, labelDiv: labelDiv });

    // Create the orbit ring
    const orbitGeometry = new THREE.RingGeometry(
      data.distance - 0.02 * sizeMultiplier,
      data.distance + 0.02 * sizeMultiplier,
      64
    );
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x6faeff,
      side: THREE.DoubleSide,
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    orbits.push(orbit);
  });
}
// Create the asteroid belt
const asteroidBelt = new THREE.Group();
const kuiperBelt = new THREE.Group(); 
scene.add(asteroidBelt);
scene.add(kuiperBelt); 


function createAsteroidBelt() {
    const asteroidCount = 1500; // Number of asteroids
    const beltInnerRadius = 2.0; // Just beyond Mars' orbit
    const beltOuterRadius = 3.2; // Just before Jupiter's orbit
    const asteroidMaterial = new THREE.MeshStandardMaterial({ map: asteroidTexture, color: 0xCDCDCD, roughness:1,metalness: 1 });

    for (let i = 0; i < asteroidCount; i++) {
        const asteroidGeometry = new THREE.SphereGeometry(THREE.MathUtils.randFloat(0, 0.3) * sizeMultiplier, 8, 8); // Small spheres
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

        // Random distance within the belt
        const distance = THREE.MathUtils.randFloat(beltInnerRadius, beltOuterRadius);

        // Random angle around the sun
        const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);

        // Random height to give thickness to the belt
        const height = THREE.MathUtils.randFloatSpread(0.1); // Slight vertical spread

        asteroid.position.set(
            Math.cos(angle) * distance,
            height,
            Math.sin(angle) * distance
        );

        // Random speed for asteroid orbit
        const speed = THREE.MathUtils.randFloat(0.0005, 0.001);

        asteroid.userData = { distance, angle, speed };

        asteroidBelt.add(asteroid);
    }
}
const sunLight = new THREE.PointLight(0xffffff, 4, 500000, 0.5);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true; // Enable shadow casting
scene.add(sunLight);

createAsteroidBelt(); // Generate the asteroid belt

function createKuiperBelt() {
    const kuiperBeltCount = 1000; // Adjust the number for performance
    const beltInnerRadius = 45; // Just beyond Neptune's orbit (30 AU)
    const beltOuterRadius = 50; // Up to 50 AU from the Sun

    const kuiperBeltMaterial = new THREE.MeshStandardMaterial({ map: asteroidTexture,  roughness:1,metalness: 0.7 });

    for (let i = 0; i < kuiperBeltCount; i++) {
        const kuiperObjectGeometry = new THREE.SphereGeometry(THREE.MathUtils.randFloat(1,3) * sizeMultiplier, 8, 8);
        const kuiperObject = new THREE.Mesh(kuiperObjectGeometry, kuiperBeltMaterial);

        // Random distance within the belt
        const distance = THREE.MathUtils.randFloat(beltInnerRadius, beltOuterRadius);

        // Random angle around the sun
        const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);

        // Random height to give thickness to the belt
        const height = THREE.MathUtils.randFloatSpread(2); // Slight vertical spread

        kuiperObject.position.set(
            Math.cos(angle) * distance,
            height,
            Math.sin(angle) * distance
        );

        // Random speed for Kuiper Belt object's orbit (slower than inner asteroids)
        const speed = THREE.MathUtils.randFloat(0.00005, 0.00015);

        kuiperObject.userData = { distance, angle, speed };

        kuiperBelt.add(kuiperObject);
    }
}


createKuiperBelt();

function createOortCloud() {
    const particleCount = 10000; // Adjust for performance
    const innerRadius = 200; // Just beyond Pluto
    const outerRadius = 300; // Scale as needed

    const positions = [];

    for (let i = 0; i < particleCount; i++) {
        const radius = THREE.MathUtils.randFloat(innerRadius, outerRadius);
        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
        const phi = Math.acos(THREE.MathUtils.randFloat(-1, 1));

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        positions.push(x, y, z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });

    const oortCloud = new THREE.Points(geometry, material);
    scene.add(oortCloud);
}

createOortCloud();

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = true;
controls.enablePan = false;

let simulationStartDate = new Date('November 2, 2024');
let simulationCurrentDate = new Date(simulationStartDate);
let lastFrameTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const currentFrameTime = performance.now();
    const deltaTime = currentFrameTime - lastFrameTime; // in milliseconds
    lastFrameTime = currentFrameTime;

    // Update simulation time
    // At speedMultiplier = 1, simulation advances 1 day per real second
    const millisecondsPerDay = 13000000000; // Number of milliseconds in a day
    const simulationMillisecondsPerRealMillisecond = speedMultiplier * millisecondsPerDay / 1000; // ms/ms

    const simulationTimeElapsed = deltaTime * simulationMillisecondsPerRealMillisecond; // in milliseconds

    // Update the simulation date
    simulationCurrentDate.setTime(simulationCurrentDate.getTime() + simulationTimeElapsed);

    // Update the date display
    dateDiv.textContent = simulationCurrentDate.toLocaleString();

  // Rotate planets
  planets.forEach((p) => {
    p.angle += p.speed * speedMultiplier;
    p.planet.position.set(
      Math.cos(p.angle) * p.distance,
      0,
      Math.sin(p.angle) * p.distance
    );
    p.planet.rotation.y += p.rotationSpeed * speedMultiplier;
  });

  // Update asteroid belt
  asteroidBelt.children.forEach((asteroid) => {
    asteroid.userData.angle += asteroid.userData.speed * speedMultiplier;
    asteroid.position.set(
      Math.cos(asteroid.userData.angle) * asteroid.userData.distance,
      asteroid.position.y, // Keep the original height
      Math.sin(asteroid.userData.angle) * asteroid.userData.distance
    );
  });

  // Update labels' positions
  labels.forEach((l) => {
    const vector = new THREE.Vector3();
    l.planet.getWorldPosition(vector);

    // Project the position to normalized device coordinates (NDC)
    vector.project(camera);

    // Convert the NDC to screen coordinates
    const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;

    // Adjust the label's position in screen space
    const labelWidth = l.labelDiv.clientWidth;
    const labelHeight = l.labelDiv.clientHeight;
    l.labelDiv.style.left = `${x - labelWidth / 2}px`; // Center the label horizontally
    l.labelDiv.style.top = `${y - labelHeight - 10}px`; // Position above the planet
  });

  // Rotate the sun
  sun.rotation.y += 0.002 * speedMultiplier;

  controls.update();

  renderer.render(scene, camera);
}

// Event listener to toggle orbit visibility
document.getElementById("toggleOrbits").addEventListener("click", () => {
  orbits.forEach((orbit) => {
    orbit.visible = !orbit.visible;
  });
});

// Get references to the slider and the speed display
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
speedSlider.addEventListener("input", () => {
  speedMultiplier = parseFloat(speedSlider.value);
  speedValue.textContent = speedMultiplier.toFixed(1) + "x";
});

// Adjust camera and renderer on window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update label positions on resize
  labels.forEach((l) => {
    l.labelDiv.style.left = "";
    l.labelDiv.style.top = "";
  });
});



document.getElementById("super-prev").addEventListener("click", () => {
  speedMultiplier = -5;
});
document.getElementById("prev").addEventListener("click", () => {
  speedMultiplier = -2;
});
document.getElementById("pause-play").addEventListener("click", () => {
  if (speedMultiplier == 0) {
    speedMultiplier = 0.1;
  } else {
    speedMultiplier = 0;
  }
});
document.getElementById("fast-forward").addEventListener("click", () => {
  speedMultiplier = 2;
});
document.getElementById("super-fast").addEventListener("click", () => {
  speedMultiplier = 5;
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function zoomAnimate() {
  for (let i = 500; i >= 2; i -= 7) {
    camera.position.set(i, i, i);
    await sleep(3);
    if (i < 10) {
      i += 6.9;
    } else if (i < 60) {
      i += 6.75;
    } else if (i < 80) {
      i += 6.4;
    } else if (i < 100) {
      i += 6;
    } else if (i < 200) {
      i += 5;
    } else if (i < 300) {
      i += 4;
    } else if (i < 400) {
      i += 3;
    }
  }
}

// Raycaster and mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentPopup = null; // Global variable to track the current popup

// Event listener for clicks
renderer.domElement.addEventListener("click", onClick, false);

function onClick(event) {
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the ray
  const intersects = raycaster.intersectObjects(planets.map((p) => p.planet));

  if (intersects.length > 0) {
    const clickedPlanet = intersects[0].object;
    const planetData = clickedPlanet.userData;
    showPopup(planetData);
  }
}

function showPopup(data) {
  // If there's already a popup open, remove it
  if (currentPopup) {
    document.body.removeChild(currentPopup);
    currentPopup = null;
  }

  // Create a popup div
  const popup = document.createElement("div");
  popup.className = "planet-popup";

  // Style the popup
  popup.style.position = "absolute";
  popup.style.top = "10px";
  popup.style.right = "10px";
  popup.style.padding = "20px";
  popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  popup.style.color = "white";
  popup.style.border = "1px solid white";
  popup.style.borderRadius = "10px";
  popup.style.zIndex = "1000";
  popup.style.maxWidth = "300px";
  popup.style.textAlign = "left";
  popup.style.fontFamily = "Poppins";

  // Add content to the popup
  const title = document.createElement("h2");
  title.textContent = data.name;
  popup.appendChild(title);

  const tempPara = document.createElement("p");
  tempPara.innerHTML = `<strong>Temperature:</strong> ${data.temperature}`;
  popup.appendChild(tempPara);

  const massPara = document.createElement("p");
  massPara.innerHTML = `<strong>Mass:</strong> ${data.mass} x 10<sup>${data.exponent}</sup> kg`;
  popup.appendChild(massPara);

  const radiusPara = document.createElement("p");
  radiusPara.innerHTML = `<strong>Radius:</strong> ${data.radius} kg`;
  popup.appendChild(radiusPara);

  const periodPara = document.createElement("p");
  periodPara.innerHTML = `<strong>Orbital Period:</strong> ${data.period} days`;
  popup.appendChild(periodPara);

  const axisPara = document.createElement("p");
  axisPara.innerHTML = `<strong>Semi-Major Axis:</strong> ${data.semiMajorAxis} AU`;
  popup.appendChild(axisPara);

  // Create the close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.marginTop = "10px";
  closeButton.style.padding = "5px 10px";
  closeButton.style.cursor = "pointer";
  closeButton.style.backgroundColor = "#ffffff";
  closeButton.style.color = "#000";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "5px";
  closeButton.style.fontSize = "14px";
  closeButton.style.fontFamily = "Poppins";

  // Attach the event listener directly to the button
  closeButton.addEventListener("click", () => {
    document.body.removeChild(popup);
    currentPopup = null; // Reset the currentPopup variable
  });

  popup.appendChild(closeButton);

  document.body.appendChild(popup);

  // Update the currentPopup variable
  currentPopup = popup;
}

// Create and style the date label
const dateDiv = document.createElement("div");
dateDiv.className = "date-label";
dateDiv.textContent = "November 2, 2024";

// Style the date label
dateDiv.style.position = "absolute";
dateDiv.style.top = "10px";
dateDiv.style.width = "100%";
dateDiv.style.textAlign = "center";
dateDiv.style.fontFamily = "Poppins";
dateDiv.style.fontWeight = "bold";
dateDiv.style.fontSize = "20px";
dateDiv.style.color = "white";
dateDiv.style.pointerEvents = "none";

function initializeSolarSystem() {
    document.body.appendChild(dateDiv);
    document.getElementById('showAssistant').style.display = 'flex';
    fetch("planetData.json")
    .then((response) => response.json())
    .then((data) => {
      planetData = data;
      initializePlanets();
      zoomAnimate();
      animate();
    })
    .catch((error) => console.error("Error loading planet data:", error));
}

const apiKey = '';

document.getElementById('sendMessage').addEventListener('click', async () => {
    const input = document.getElementById('userInput').value;
    const responseElement = document.getElementById('response');

    responseElement.textContent = 'Thinking...';

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", 
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: input }
                ],
                max_tokens: 150
            })
        });

        if (response.ok) {
            const data = await response.json();
            responseElement.textContent = data.choices[0].message.content.trim();
        } else {
            responseElement.textContent = 'Error: ' + response.statusText;
        }
    } catch (error) {
        responseElement.textContent = 'Error: ' + error.message;
    }

    document.getElementById('userInput').value = '';
});

document.getElementById('closeButton').addEventListener('click', () => {
    document.getElementById('assistant').style.display = 'none';
    document.getElementById('showAssistant').style.display = 'flex';
});

document.getElementById('showAssistant').addEventListener('click', () => {
    document.getElementById('assistant').style.display = 'flex';
    document.getElementById('showAssistant').style.display = 'none';
});