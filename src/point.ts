import * as THREE from 'three';
import { 
  ObjectDefinition, 
  GridPatternParameters,
  CirclePatternParameters,
  CubePatternParameters,
  SpherePatternParameters 
} from './types';
import { PointTexture } from './texture';
import { Behavior, StaticBehavior } from './behaviors';

export class Point {
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

  static createFromDefinition(def: ObjectDefinition): Point[] {
    switch (def.positions.pattern) {
      case 'grid':
        return Point.createGrid({
          ...def.positions.parameters as GridPatternParameters,
          template: def.template
        });
      case 'circle':
        return Point.createCircle({
          ...def.positions.parameters as CirclePatternParameters,
          template: def.template
        });
      case 'cube':
        return Point.createCube({
          ...def.positions.parameters as CubePatternParameters,
          template: def.template
        });
      case 'sphere':
        return Point.createSphere({
          ...def.positions.parameters as SpherePatternParameters,
          template: def.template
        });
      default:
        throw new Error(`Unsupported pattern: ${def.positions.pattern}`);
    }
  }

  private static createGrid(params: GridPatternParameters & { 
    template: { size: number | string; rgba: string } 
  }): Point[] {
    const points: Point[] = [];
    const [nx, ny, nz] = params.dimensions;
    const [ox, oy, oz] = params.origin;
    const size = typeof params.template.size === 'number' ? 
      params.template.size : parseFloat(params.template.size);

    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        if (params.style === 'plane') {
          const position = new THREE.Vector3(
            ox + x * params.spacing,
            oy + y * params.spacing,
            oz
          );
          points.push(new Point(position, size, params.template.rgba));
        } else {
          for (let z = 0; z < nz; z++) {
            const position = new THREE.Vector3(
              ox + x * params.spacing,
              oy + y * params.spacing,
              oz + z * params.spacing
            );
            points.push(new Point(position, size, params.template.rgba));
          }
        }
      }
    }
    return points;
  }

  private static createCircle(params: CirclePatternParameters & {
    template: { size: number | string; rgba: string }
  }): Point[] {
    const points: Point[] = [];
    const [ox, oy, oz] = params.origin;
    const size = typeof params.template.size === 'number' ? 
      params.template.size : parseFloat(params.template.size);

    for (let i = 0; i < params.count; i++) {
      const angle = (2 * Math.PI * i) / params.count;
      let position: THREE.Vector3;

      switch (params.plane) {
        case 'xy':
          position = new THREE.Vector3(
            ox + params.radius * Math.cos(angle),
            oy + params.radius * Math.sin(angle),
            oz
          );
          break;
        case 'yz':
          position = new THREE.Vector3(
            ox,
            oy + params.radius * Math.cos(angle),
            oz + params.radius * Math.sin(angle)
          );
          break;
        case 'xz':
          position = new THREE.Vector3(
            ox + params.radius * Math.cos(angle),
            oy,
            oz + params.radius * Math.sin(angle)
          );
          break;
      }
      
      points.push(new Point(position, size, params.template.rgba));
    }
    return points;
  }

  private static createCube(params: CubePatternParameters & {
    template: { size: number | string; rgba: string }
  }): Point[] {
    const points: Point[] = [];
    const [ox, oy, oz] = params.origin;
    const size = typeof params.template.size === 'number' ? 
      params.template.size : parseFloat(params.template.size);
    const spacing = params.size / (params.edgeCount - 1);

    // 各辺に沿って点を生成
    // 前面の4辺
    for (let i = 0; i < params.edgeCount; i++) {
      // 下辺
      points.push(new Point(
        new THREE.Vector3(ox + i * spacing, oy, oz),
        size, params.template.rgba
      ));
      // 上辺
      points.push(new Point(
        new THREE.Vector3(ox + i * spacing, oy + params.size, oz),
        size, params.template.rgba
      ));
      // 左辺
      points.push(new Point(
        new THREE.Vector3(ox, oy + i * spacing, oz),
        size, params.template.rgba
      ));
      // 右辺
      points.push(new Point(
        new THREE.Vector3(ox + params.size, oy + i * spacing, oz),
        size, params.template.rgba
      ));
    }

    // 後面の4辺
    for (let i = 0; i < params.edgeCount; i++) {
      // 下辺
      points.push(new Point(
        new THREE.Vector3(ox + i * spacing, oy, oz + params.size),
        size, params.template.rgba
      ));
      // 上辺
      points.push(new Point(
        new THREE.Vector3(ox + i * spacing, oy + params.size, oz + params.size),
        size, params.template.rgba
      ));
      // 左辺
      points.push(new Point(
        new THREE.Vector3(ox, oy + i * spacing, oz + params.size),
        size, params.template.rgba
      ));
      // 右辺
      points.push(new Point(
        new THREE.Vector3(ox + params.size, oy + i * spacing, oz + params.size),
        size, params.template.rgba
      ));
    }

    // 接続辺
    for (let i = 0; i < params.edgeCount; i++) {
      points.push(new Point(
        new THREE.Vector3(ox, oy, oz + i * spacing),
        size, params.template.rgba
      ));
      points.push(new Point(
        new THREE.Vector3(ox + params.size, oy, oz + i * spacing),
        size, params.template.rgba
      ));
      points.push(new Point(
        new THREE.Vector3(ox, oy + params.size, oz + i * spacing),
        size, params.template.rgba
      ));
      points.push(new Point(
        new THREE.Vector3(ox + params.size, oy + params.size, oz + i * spacing),
        size, params.template.rgba
      ));
    }

    return points;
  }

  private static createSphere(params: SpherePatternParameters & {
    template: { size: number | string; rgba: string }
  }): Point[] {
    const points: Point[] = [];
    const [ox, oy, oz] = params.origin;
    const size = typeof params.template.size === 'number' ? 
      params.template.size : parseFloat(params.template.size);

    // 緯度方向のループ（極から極まで）
    for (let lat = 0; lat <= params.latitudeCount; lat++) {
      const phi = (Math.PI * lat) / params.latitudeCount;
      
      // 経度方向のループ（一周）
      for (let lon = 0; lon < params.longitudeCount; lon++) {
        const theta = (2 * Math.PI * lon) / params.longitudeCount;
        
        // 球面座標から直交座標に変換
        const x = ox + params.radius * Math.sin(phi) * Math.cos(theta);
        const y = oy + params.radius * Math.sin(phi) * Math.sin(theta);
        const z = oz + params.radius * Math.cos(phi);
        
        points.push(new Point(
          new THREE.Vector3(x, y, z),
          size,
          params.template.rgba
        ));
      }
    }

    return points;
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
