import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';


// JSONデータの型定義
interface SceneDefinition {
  objects: {
    [key: string]: {
      type: string;
      size: number | string;
      rgba: string;
      pos: [number, number, number];
      rot: {
        euler?: [number, number, number];
        axis?: [number, number, number];
        angle?: number;
        quaternion?: [number, number, number, number];
      };
    };
  };
  groups: {
    [key: string]: string[];
  };
  animations?: any[]; // アニメーションは後で実装
  help?: any[];
  metadata?: any[];
  environment?: any[];
}

////////////////////////////////////////////////////////////////
// テクスチャ生成クラス
class PointTexture {
  static create(color: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D context');
    
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.1, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}

////////////////////////////////////////////////////////////////
// 基本的な動作パラメータのインターフェース
interface BehaviorOptions {
  range: number;
}

// 基底となる動作クラス
abstract class Behavior {
  protected initialPosition: THREE.Vector3;
  protected currentPosition: THREE.Vector3;
  protected time: number = 0;
  
  constructor(initialPosition: THREE.Vector3) {
    this.initialPosition = initialPosition.clone();
    this.currentPosition = initialPosition.clone();
  }
  
  abstract update(deltaTime: number): void;
  
  getPosition(): THREE.Vector3 {
    return this.currentPosition;
  }
  
  protected updateTime(deltaTime: number): void {
    this.time += deltaTime;
  }
}

// 回転動作
class RotationBehavior extends Behavior {
  private rotationAxis: THREE.Vector3;
  private rotationSpeed: number;
  
  constructor(initialPosition: THREE.Vector3, options?: BehaviorOptions) {
    super(initialPosition);
    this.rotationAxis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    this.rotationSpeed = Math.random() * 0.02 + 0.01;
  }
  
  update(deltaTime: number): void {
    this.updateTime(deltaTime);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(this.rotationAxis, this.rotationSpeed);
    this.currentPosition.applyQuaternion(quaternion);
  }
}

// 並進動作
interface TranslationOptions extends BehaviorOptions {
  distance: { min: number; max: number };
  speed: { min: number; max: number };
}

class TranslationBehavior extends Behavior {
  private direction: THREE.Vector3;
  private distance: number;
  private speed: number;
  private initialDirection: THREE.Vector3;
  
  constructor(initialPosition: THREE.Vector3, options?: TranslationOptions) {
    super(initialPosition);
    
    const defaultOptions = {
      distance: { min: 0.5, max: 2.0 },
      speed: { min: 0.02, max: 0.05 }
    };
    
    const opts = { ...defaultOptions, ...options };
    
    this.initialDirection = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    
    this.direction = this.initialDirection.clone();
    this.distance = Math.random() * 
      (opts.distance.max - opts.distance.min) + opts.distance.min;
    this.speed = Math.random() * 
      (opts.speed.max - opts.speed.min) + opts.speed.min;
  }
  
  update(deltaTime: number): void {
    this.updateTime(deltaTime);
    
    const offset = this.currentPosition.clone().sub(this.initialPosition);
    const currentDistance = offset.length();
    
    if (currentDistance >= this.distance) {
      this.direction.multiplyScalar(-1);
    }
    
    this.currentPosition.add(
      this.direction.clone().multiplyScalar(this.speed * deltaTime)
    );
  }
}

// 軌道動作
interface OrbitOptions extends BehaviorOptions {
  radius: { min: number; max: number };
  speed: { min: number; max: number };
}

class OrbitBehavior extends Behavior {
  private radius: number;
  private speed: number;
  
  constructor(initialPosition: THREE.Vector3, options?: OrbitOptions) {
    super(initialPosition);
    
    const defaultOptions = {
      radius: { min: 1, max: 3 },
      speed: { min: 0.02, max: 0.04 }
    };
    
    const opts = { ...defaultOptions, ...options };
    
    this.radius = Math.random() * 
      (opts.radius.max - opts.radius.min) + opts.radius.min;
    this.speed = Math.random() * 
      (opts.speed.max - opts.speed.min) + opts.speed.min;
  }
  
  update(deltaTime: number): void {
    this.updateTime(deltaTime);
    const angle = this.time * this.speed;
    
    this.currentPosition.x = this.initialPosition.x + 
      Math.cos(angle) * this.radius;
    this.currentPosition.y = this.initialPosition.y + 
      Math.sin(angle * 0.5) * this.radius;
    this.currentPosition.z = this.initialPosition.z + 
      Math.sin(angle) * this.radius;
  }
}

// 静止動作
class StaticBehavior extends Behavior {
  update(deltaTime: number): void {
    // 静止点は更新不要
  }
}

////////////////////////////////////////////////////////////////
// 点の状態管理クラス
class Point {
  private behavior: Behavior;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  
  constructor(
    position: THREE.Vector3,
    size: number,
    color: string,
    behavior?: Behavior
  ) {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([0, 0, 0]);
    this.geometry.setAttribute('position', 
                               new THREE.Float32BufferAttribute(positions, 3));
    
    this.material = new THREE.PointsMaterial({
      size: size,
      map: PointTexture.create(color),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.position.copy(position);
    
    this.behavior = behavior || new StaticBehavior(position);
  }
  
  update(deltaTime: number): void {
    this.behavior.update(deltaTime);
    this.points.position.copy(this.behavior.getPosition());
  }
  
  getMesh(): THREE.Points {
    return this.points;
  }
  
  setBehavior(behavior: Behavior): void {
    this.behavior = behavior;
  }
}

// 線の状態管理クラス
class Line {
  private geometry: THREE.BufferGeometry;
  private material: THREE.LineBasicMaterial;
  private line: THREE.Line;
  private behavior: Behavior;
  
  constructor(
    position: THREE.Vector3,
    width: number,
    length: number,
    color: string,
    behavior?: Behavior
  ) {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      0, 0, length
    ]);
    
    this.geometry.setAttribute('position', 
                               new THREE.Float32BufferAttribute(positions, 3));
    
    this.material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color)
    });
    
    this.line = new THREE.Line(this.geometry, this.material);
    this.line.position.copy(position);
    this.line.scale.set(width, 1, 1);
    
    this.behavior = behavior || new StaticBehavior(position);
  }
  
  update(deltaTime: number): void {
    this.behavior.update(deltaTime);
    this.line.position.copy(this.behavior.getPosition());
  }
  
  getMesh(): THREE.Line {
    return this.line;
  }
  
  setBehavior(behavior: Behavior): void {
    this.behavior = behavior;
  }
}

////////////////////////////////////////////////////////////////
// 統合システムクラス
class IntegratedSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private objects: Map<string, Point | Line> = new Map();
  private groups: Map<string, string[]> = new Map();
  
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.renderer = new THREE.WebGLRenderer();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    this.initRenderer();
    this.initCamera();

    this.setupEventListeners();
  }
  
  private initRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }
  
  private initCamera(): void {
    //this.camera.position.z = 5;
    //this.camera.rotation.x = -Math.PI / 6; // 下向きに30度傾ける
    //this.camera.lookAt(new THREE.Vector3(0, -10, 0)); // 原点を見下ろす
    this.camera.position.set(-2, 4, 2); // 高さ10、前方10
    this.camera.lookAt(0, 0, 0);
  }
  
  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }
  
  private createObject(id: string, def: SceneDefinition['objects'][string]): void {
    const position = new THREE.Vector3(...def.pos);
    let object: Point | Line;
    
    if (def.type === 'point') {
      object = new Point(
        position,
        typeof def.size === 'number' ? def.size : parseFloat(def.size),
        def.rgba
      );
    } else if (def.type === 'line') {
      const [width, length] = typeof def.size === 'string' ? 
        def.size.split('x').map(Number) : [def.size, def.size];
      object = new Line(position, width, length, def.rgba);
    } else {
      throw new Error(`Unsupported object type: ${def.type}`);
    }
    
    // 回転の設定
    const mesh = object.getMesh();
    if (def.rot.euler) {
      mesh.rotation.set(...def.rot.euler);
    } else if (def.rot.quaternion) {
      mesh.quaternion.set(...def.rot.quaternion);
    } else if (def.rot.axis && def.rot.angle !== undefined) {
      const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(
        new THREE.Vector3(...def.rot.axis),
        def.rot.angle
      );
      mesh.quaternion.copy(quaternion);
    }
    
    this.objects.set(id, object);
    this.scene.add(mesh);
    this.scene.add(new THREE.AxesHelper(1.4));
    
  }
  
  public loadFromJSON(data: SceneDefinition): void {
    // オブジェクトの作成
    Object.entries(data.objects).forEach(([id, def]) => {
      this.createObject(id, def);
    });
    
    // グループの登録
    Object.entries(data.groups).forEach(([groupId, members]) => {
      this.groups.set(groupId, members);
    });
  }
  
  private updateObjects(): void {
    const deltaTime = 0.016; // おおよそ60FPSを想定
    this.objects.forEach(object => {
      object.update(deltaTime);
    });
  }
  
  public animate = (): void => {
    requestAnimationFrame(this.animate);
    this.updateObjects();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// 使用例
const system = new IntegratedSystem();

// テストデータの読み込み
const sceneData: SceneDefinition = {
  "objects": {
    "tgt00": {
      "type": "point",
      "size": 0.3,
      "rgba": "#00ff00ff",
      "pos": [0.0, 0.0, 0.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt01": {
      "type": "point",
      "size": 0.3,
      "rgba": "#ff0000ff",
      "pos": [1.0, 0.0, 0.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt02": {
      "type": "point",
      "size": 0.3,
      "rgba": "#0000ffff",
      "pos": [1.0, 1.0, 0.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt03": {
      "type": "point",
      "size": 0.3,
      "rgba": "#ffff00ff",
      "pos": [1.0, 1.0, 1.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt04": {
      "type": "point",
      "size": 0.3,
      "rgba": "#00ffffff",
      "pos": [0.0, 1.0, 1.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt05": {
      "type": "point",
      "size": 0.3,
      "rgba": "#ff00ffff",
      "pos": [0.0, 1.0, 0.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt06": {
      "type": "point",
      "size": 0.3,
      "rgba": "#ff99ffff",
      "pos": [0.0, 0.0, 1.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt07": {
      "type": "point",
      "size": 0.3,
      "rgba": "#ffffffff",
      "pos": [1.0, 0.0, 1.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt10": {
      "type": "line",
      "size": "1x3",
      "rgba": "#ff0000ff",
      "pos": [0.0, 0.0, 0.0],
      "rot": {
        "euler": [0.0, -3.1415/2.0, 0.0]
      }
    },
    "tgt11": {
      "type": "line",
      "size": "1x3",
      "rgba": "#ff0000ff",
      "pos": [1.0, 0.0, 0.0],
      "rot": {
        "euler": [0.0, -3.14, 0.0]
      }
    },
    "tgt12": {
      "type": "line",
      "size": "1x3",
      "rgba": "#ffff00ff",
      "pos": [0.0, 0.0, 1.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    },
    "tgt13": {
      "type": "line",
      "size": "1x3",
      "rgba": "#ffff00ff",
      "pos": [1.0, 0.0, 1.0],
      "rot": {
        "euler": [0.0, 3.1415/2.0, 0.0]
      }
    }
  },
  "groups": {
    "g1": ["tgt1"],
    "g2": ["tgt2"]
  }
};

system.loadFromJSON(sceneData);
system.animate();
