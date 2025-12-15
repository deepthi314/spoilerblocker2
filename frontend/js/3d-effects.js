document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
});

function initThreeJS() {
    const container = document.querySelector('.hero-visual');
    if (!container) return;

    // Remove existing placeholder
    container.innerHTML = '';

    // Scene Setup
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Objects
    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshPhongMaterial({
        color: 0x6366F1, // Indigo
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    const mainShape = new THREE.Mesh(geometry, material);
    scene.add(mainShape);

    // Floating Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0xEC4899, // Pink
        transparent: true,
        opacity: 0.8
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xEC4899, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x6366F1, 1);
    pointLight2.position.set(-5, -5, -5);
    scene.add(pointLight2);

    // Animation Loop
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        // Rotate Main Shape
        mainShape.rotation.y += 0.005;
        mainShape.rotation.x += 0.002;

        // Mouse influence
        mainShape.rotation.y += 0.05 * (targetX - mainShape.rotation.y);
        mainShape.rotation.x += 0.05 * (targetY - mainShape.rotation.x);

        // Float effect
        mainShape.position.y = Math.sin(elapsedTime) * 0.2;

        // Particle rotation
        particlesMesh.rotation.y = -elapsedTime * 0.05;
        particlesMesh.rotation.x = elapsedTime * 0.02;

        renderer.render(scene, camera);
    }

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
