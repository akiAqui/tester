import * as THREE from 'three';
import { 
  ObjectDefinition, 
  GridPatternParameters,
  CirclePatternParameters,
  CubePatternParameters
} from './types';
import { Behavior, StaticBehavior } from './behaviors';

export class Line {
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

  static createFromDefinition(def: ObjectDefinition): Line[] {
    switch (def.positions.pattern) {
      case 'grid':
        return Line.createGrid({
          ...def.positions.parameters as GridPatternParameters,
          template: def.template
        });
      case 'circle':
        return Line.createRadial({
          ...def.positions.parameters as CirclePatternParameters,
          template: def.template
        });
      case 'cube':
        return Line.createCubeFrame({
          ...def.positions.parameters as CubePatternParameters,
          template: def.template
        });
      default:
        throw new Error(`Unsupported pattern: ${def.positions.pattern}`);
    }
  }

  private static createGrid(params: GridPatternParameters & {
    template: { size: string; rgba: string }
  }): Line[] {
    const lines: Line[] = [];
    const [nx, ny, nz] = params.dimensions;
    const [ox, oy, oz] = params.origin;
    const [width, length] = params.template.size.split('x').map(Number);

    // 水平方向の線
    for (let y = 0; y < ny; y++) {
      const position = new THREE.Vector3(ox, oy + y * params.spacing, oz);
      lines.push(new Line(
        position,
        width,
        (nx - 1) * params.spacing,
        params.template.rgba
      ));
    }

    // 垂直方向の線
    for (let x = 0; x < nx; x++) {
      const position = new THREE.Vector3(ox + x * params.spacing, oy, oz);
      const vertLine = new Line(
        position,
        width,
        (ny - 1) * params.spacing,
        params.template.rgba
      );
      vertLine.getMesh().rotation.z = Math.PI / 2;
      lines.push(vertLine);
    }

    if (params.style === 'volume' && nz > 1) {
      // 奥行き方向の線（3D grid の場合）
      for (let x = 0; x < nx; x++) {
        for (let y = 0; y < ny; y++) {
          const position = new THREE.Vector3(
            ox + x * params.spacing,
            oy + y * params.spacing,
            oz
          );
          const depthLine = new Line(
            position,
            width,
            (nz - 1) * params.spacing,
            params.template.rgba
          );
          depthLine.getMesh().rotation.y = Math.PI / 2;
          lines.push(depthLine);
        }
      }
    }

    return lines;
  }

  private static createRadial(params: CirclePatternParameters & {
    template: { size: string; rgba: string }
  }): Line[] {
    const lines: Line[] = [];
    const [ox, oy, oz] = params.origin;
    const [width, length] = params.template.size.split('x').map(Number);

    for (let i = 0; i < params.count; i++) {
      const angle = (2 * Math.PI * i) / params.count;
      const dirVector = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      );

      const position = new THREE.Vector3(ox, oy, oz);
      const line = new Line(
        position,
        width,
        params.radius,
        params.template.rgba
      );

      // 方向ベクトルに基づいて回転を設定
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.lookAt(
        new THREE.Vector3(0, 0, 0),
        dirVector,
        new THREE.Vector3(0, 0, 1)
      );
      const quaternion = new THREE.Quaternion();
      quaternion.setFromRotationMatrix(rotationMatrix);
      line.getMesh().quaternion.copy(quaternion);

      lines.push(line);
    }

    return lines;
  }

  private static createCubeFrame(params: CubePatternParameters & {
    template: { size: string; rgba: string }
  }): Line[] {
    const lines: Line[] = [];
    const [ox, oy, oz] = params.origin;
    const [width, length] = params.template.size.split('x').map(Number);
    const cubeSize = params.size;

    // 底面の4辺
    lines.push(new Line(
      new THREE.Vector3(ox, oy, oz),
      width,
      cubeSize,
      params.template.rgba
    ));
    lines.push(new Line(
      new THREE.Vector3(ox, oy + cubeSize, oz),
      width,
      cubeSize,
      params.template.rgba
    ));
    
    const sideEdge1 = new Line(
      new THREE.Vector3(ox, oy, oz),
      width,
      cubeSize,
      params.template.rgba
    );
    sideEdge1.getMesh().rotation.z = Math.PI / 2;
    lines.push(sideEdge1);
    
    const sideEdge2 = new Line(
      new THREE.Vector3(ox + cubeSize, oy, oz),
      width,
      cubeSize,
      params.template.rgba
    );
    sideEdge2.getMesh().rotation.z = Math.PI / 2;
    lines.push(sideEdge2);

    // 上面の4辺 (z方向にcubeSize移動)
    lines.push(new Line(
      new THREE.Vector3(ox, oy, oz + cubeSize),
      width,
      cubeSize,
      params.template.rgba
    ));
    lines.push(new Line(
      new THREE.Vector3(ox, oy + cubeSize, oz + cubeSize),
      width,
      cubeSize,
      params.template.rgba
    ));
    
    const topSideEdge1 = new Line(
      new THREE.Vector3(ox, oy, oz + cubeSize),
      width,
      cubeSize,
      params.template.rgba
    );
    topSideEdge1.getMesh().rotation.z = Math.PI / 2;
    lines.push(topSideEdge1);
    
    const topSideEdge2 = new Line(
      new THREE.Vector3(ox + cubeSize, oy, oz + cubeSize),
      width,
      cubeSize,
      params.template.rgba
    );
    topSideEdge2.getMesh().rotation.z = Math.PI / 2;
    lines.push(topSideEdge2);

    // 垂直方向の4辺
    const vertEdges = [
      [ox, oy, oz],
      [ox + cubeSize, oy, oz],
      [ox, oy + cubeSize, oz],
      [ox + cubeSize, oy + cubeSize, oz]
    ];

    vertEdges.forEach(([x, y, z]) => {
      const vertLine = new Line(
        new THREE.Vector3(x, y, z),
        width,
        cubeSize,
        params.template.rgba
      );
      vertLine.getMesh().rotation.x = -Math.PI / 2;
      lines.push(vertLine);
    });

    return lines;
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
