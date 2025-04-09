import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";

// ?? シーン & カメラ & レンダラーをセットアップ
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // HDRトーンマッピング適用
renderer.toneMappingExposure = 0.91;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// ?? EXR 環境マップをロード
const exrLoader = new EXRLoader();
//exrLoader.load('/hdr/studio_small_09_2k.exr', (texture) => {
  exrLoader.load('/hdr/brown_photostudio_01_2k.exr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    //texture.type = THREE.HalfFloatType;
    scene.environment = texture;
    //scene.background = texture; // 背景もEXRに（不要なら削除）
});

// ?? ライト（最低限の補助ライト）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// ?? ボックスを 10x10 に減らす（合計 100個）
const boxes: THREE.Mesh[] = [];
const gridSize = 5;

for (let x = -gridSize; x < gridSize; x++) {
  for (let z = -gridSize; z < gridSize; z++) {
    const geometry = new THREE.SphereGeometry( 0.2, 32, 16 ); //BoxGeometry(0.5, 0.5, 0.5);

const material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 1.0,  // 透過を最大に
  opacity: 1.0,       // 不透明度は100%（transmissionが透過を制御）
  metalness: 0.1,
  roughness: 0.05,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  ior: 1.5,  // 屈折率（1.0=空気, 1.5=ガラス）
  thickness: 0.5, // 屈折の影響を持たせる
  attenuationColor: new THREE.Color(1, 1, 1), // 光の減衰色
  attenuationDistance: 1.0, // 減衰距離
  depthWrite: false,  // 深度バッファを無効化（重なりを正しく描画）
  side: THREE.FrontSide, // 片面描画で透過を正しく処理
});


    
    /*
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() * 0xffffff,
      metalness: 0.5,  // 金属っぽい質感
      roughness: 0.2,  // 少しツヤを持たせる
      });
    */
    /*
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparency: true,
      opacity: 1.0,
      metalness: 0.1,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 1.0, // 屈折率を考慮した透過
      ior: 1.5, // 屈折率（1.0=空気, 1.5=ガラス）
    });
*/
/*
    const material = new THREE.MeshPhysicalMaterial({
      color: Math.random() * 0xffffff,
      metalness: 0.1,  // 金属っぽい質感
      roughness: 0.05,  // 少しツヤを持たせる
      transparency: true,
      opacity:0.3,
      transmission:0.9,
      ior:1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
*/
        const box = new THREE.Mesh(geometry, material);
        box.position.set(x, Math.random() * 0.5, z);
        scene.add(box);
        boxes.push(box);
    }
}

// ?? マウス操作可能に
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ? FPS 計測用
let lastFrameTime = performance.now();
let frameCount = 0;
const fpsElement = document.createElement("div");
fpsElement.style.position = "absolute";
fpsElement.style.top = "10px";
fpsElement.style.left = "10px";
fpsElement.style.color = "white";
fpsElement.style.fontSize = "20px";
document.body.appendChild(fpsElement);

// ?? アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    // FPS 計測
    const now = performance.now();
    frameCount++;
    if (now - lastFrameTime >= 1000) {
        fpsElement.textContent = `FPS: ${frameCount}`;
        frameCount = 0;
        lastFrameTime = now;
    }

    // ボックスを回転
    boxes.forEach((box) => {
        box.rotation.x += 0.005;
        box.rotation.y += 0.005;
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();

// ?? ウィンドウリサイズ対応
window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

