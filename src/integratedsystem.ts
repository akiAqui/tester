import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Point } from './point';
import { Line } from './line';
import { SceneDefinition } from './types';

export class IntegratedSystem {
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
    this.camera.position.set(-2, 4, 2);
    this.camera.lookAt(0, 0, 0);
  }
  
  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }
  
  private configureEnvironment(data: SceneDefinition): void {
    if (data.environment?.axis) {
      this.scene.add(new THREE.AxesHelper(1.4));
    }

    if (data.environment?.camera) {
      const pos = data.environment.camera.position;
      this.camera.position.set(pos[0], pos[1], pos[2]);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public loadFromJSON(data: SceneDefinition): void {
    // 環境設定の適用
    this.configureEnvironment(data);

    // オブジェクト定義からオブジェクトを生成
    if (data.objectDefinitions) {
      data.objectDefinitions.forEach(def => {
        let objects: (Point | Line)[];
        
        if (def.type === 'point') {
          objects = Point.createFromDefinition(def);
        } else if (def.type === 'line') {
          objects = Line.createFromDefinition(def);
        } else {
          throw new Error(`Unsupported object type: ${def.type}`);
        }

        // 生成したオブジェクトの登録
        objects.forEach((obj, index) => {
          const id = this.generateObjectId(def.id, index);
          this.objects.set(id, obj);
          this.scene.add(obj.getMesh());
        });
      });
    }

    // グループ定義の処理
    if (data.groups) {
      Object.entries(data.groups).forEach(([groupId, groupDef]) => {
        if (groupDef.type === 'index') {
          const members = this.resolveIndexBasedGroup(
            groupDef.generator,
            groupDef.idRange || [0, 0]
          );
          this.groups.set(groupId, members);
        } else if (groupDef.type === 'spatial') {
          const members = this.resolveSpatialGroup(
            groupDef.generator,
            groupDef.condition || { region: 'sphere', center: [0, 0, 0], radius: 0 }
          );
          this.groups.set(groupId, members);
        }
        // Pattern based groupingは後で実装
      });
    }
  }

  private generateObjectId(baseId: string, index: number): string {
    return `${baseId}/${index}`;
  }

  private resolveIndexBasedGroup(
    generator: string,
    range: [number, number]
  ): string[] {
    const members: string[] = [];
    for (let i = range[0]; i <= range[1]; i++) {
      members.push(`${generator}/${i}`);
    }
    return members;
  }

  private resolveSpatialGroup(
    generator: string,
    condition: {
      region: string;
      center: [number, number, number];
      radius: number;
    }
  ): string[] {
    const members: string[] = [];
    const center = new THREE.Vector3(...condition.center);

    this.objects.forEach((obj, id) => {
      if (id.startsWith(generator)) {
        const pos = obj.getMesh().position;
        if (condition.region === 'sphere') {
          if (pos.distanceTo(center) <= condition.radius) {
            members.push(id);
          }
        }
        // 他の空間条件も同様に実装可能
      }
    });

    return members;
  }

  public getGroup(groupId: string): string[] {
    return this.groups.get(groupId) || [];
  }

  private updateObjects(): void {
    const deltaTime = 0.016; // ~60FPS
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
