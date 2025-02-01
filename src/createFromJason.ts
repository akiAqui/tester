import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
}

// 点のタイプと動作の定義は既存のまま
type MotionType = 'rotation' | 'translation' | 'orbit' | 'static';


class DynamicPointSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private objects: Map<string, THREE.Object3D> = new Map();
  private groups: Map<string, string[]> = new Map();

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
    this.camera.position.z = 5;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  private createObject(id: string, def: SceneDefinition['objects'][string]): THREE.Object3D {
    let object: THREE.Object3D;

    if (def.type === 'point') {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([0, 0, 0]);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        size: typeof def.size === 'number' ? def.size : parseFloat(def.size),
        map: LuminousPointTexture.create(def.rgba),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      object = new THREE.Points(geometry, material);
    } else if (def.type === 'line') {
      const geometry = new THREE.BufferGeometry();
      let [width, length] = typeof def.size === 'string' ? 
        def.size.split('x').map(Number) : [def.size, def.size];
      
      const positions = new Float32Array([
        0, 0, 0,
        0, 0, length
      ]);
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(def.rgba),
      });

      object = new THREE.Line(geometry, material);
      object.scale.set(width, 1, 1);
    } else {
      throw new Error(`Unsupported object type: ${def.type}`);
    }

    // 位置の設定
    object.position.set(...def.pos);

    // 回転の設定
    if (def.rot.euler) {
      object.rotation.set(...def.rot.euler);
    } else if (def.rot.quaternion) {
      object.quaternion.set(...def.rot.quaternion);
    } else if (def.rot.axis && def.rot.angle !== undefined) {
      const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(
        new THREE.Vector3(...def.rot.axis),
        def.rot.angle
      );
      object.quaternion.copy(quaternion);
    }

    return object;
  }

  public loadFromJSON(data: SceneDefinition): void {
    // オブジェクトの作成
    Object.entries(data.objects).forEach(([id, def]) => {
      const object = this.createObject(id, def);
      this.objects.set(id, object);
      this.scene.add(object);
    });

    // グループの登録
    Object.entries(data.groups).forEach(([groupId, members]) => {
      this.groups.set(groupId, members);
    });
  }

  public getObject(id: string): THREE.Object3D | undefined {
    return this.objects.get(id);
  }

  public getGroupObjects(groupId: string): THREE.Object3D[] {
    const memberIds = this.groups.get(groupId);
    if (!memberIds) return [];
    return memberIds.map(id => this.objects.get(id)).filter((obj): obj is THREE.Object3D => obj !== undefined);
  }

  public animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// 使用例
const pointSystem = new DynamicPointSystem();

// JSONデータの読み込み（実際のデータをここに配置）
const sceneData = {
  "objects": {
    "tgt1": {
      "type": "point",
      "size": 1,
      "rgba": "#ffffffff",
      "pos": [0.0, 0.0, 0.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]  // [x, y, z] in radians
      }
    },
    "tgt2": {
      "type": "point",
      "size": 1,
      "rgba": "#ffffffff",
      "pos": [1.0, 0.0, 0.0],
      "rot": {
        "axis": [1.0, 0.0, 0.0],  // 回転軸
        "angle": 1.57             // 角度（ラジアン）
      }
    },
    "tgt3": {
      "type": "line",
      "size": "1x3",
      "rgba": "#ff0000ff",
      "pos": [0.0, 0.0, 0.0],
      "rot": {
        "quaternion": [0.0, 0.0, 0.0, 1.0]  // [x, y, z, w]
      }
    },
    "tgt4": {
      "type": "line",
      "size": "1x3",
      "rgba": "#ff0000ff",
      "pos": [1.0, 0.0, 0.0],
      "rot": {
        "euler": [0.0, 0.0, 0.0]
      }
    }
  },
  "groups": {
    "g1": ["tgt1", "tgt2"],
    "g2": ["tgt3", "tgt4"]
  },
  "animations": [
    {
      "id": 0,
      "target": "g1",
      "type": "trans",
      "properties": { 
        "x": 2.0
      },
      "dur": 1.0,
      "start": {
        "time": 0.0
      }
    },
    {
      "id": 1,
      "target": "g2",
      "type": "rot",
      "properties": { 
        "euler": [0.0, 3.14159, 0.0]  // Y軸周りにπラジアン
      },
      "dur": 2.0,
      "start": {
        "time": 1.0
      }
    },
    {
      "id": 2,
      "target": "tgt1",
      "type": "trans",
      "properties": {
        "z": 3.0
      },
      "dur": 1.5,
      "start": {
        "after": 0
      }
    }
  ]
};

pointSystem.loadFromJSON(sceneData);
pointSystem.animate();
