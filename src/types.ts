qqimport * as THREE from 'three';

// パターン生成のためのパラメータ定義
interface GridPatternParameters {
  spacing: number;
  dimensions: [number, number, number];
  origin: [number, number, number];
  style: 'plane' | 'volume';
}

interface CirclePatternParameters {
  radius: number;
  count: number;
  plane: 'xy' | 'yz' | 'xz';
  origin: [number, number, number];
}

interface LinePatternParameters {
  start: [number, number, number];
  end: [number, number, number];
  count: number;
  spacing: 'uniform' | 'random';
}

// オブジェクトの位置定義
interface PositionDefinition {
  type: 'pattern';
  pattern: 'grid' | 'circle' | 'line';
  parameters: GridPatternParameters | CirclePatternParameters | LinePatternParameters;
}

// オブジェクトテンプレート定義
interface ObjectTemplate {
  size: number | string;
  rgba: string;
}

// 単一オブジェクト定義
interface ObjectDefinition {
  id: string;
  type: 'point' | 'line';
  count: number;
  template: ObjectTemplate;
  positions: PositionDefinition;
}

// グループ定義
interface GroupDefinition {
  type: 'index' | 'spatial' | 'pattern';
  generator: string;
  idRange?: [number, number];
  condition?: {
    region: string;
    center: [number, number, number];
    radius: number;
  };
}

// シーン定義の拡張
interface SceneDefinition {
  metadata?: {
    version: string;
    description: string;
  };
  debug?: {
    validateConstraints: boolean;
    logLevel: string;
    perfMetrics: boolean;
  };
  environment?: {
    axis: boolean;
    camera: {
      position: [number, number, number];
      type: string;
    };
  };
  objectDefinitions: ObjectDefinition[];
  groups: { [key: string]: GroupDefinition };
}

export {
  GridPatternParameters,
  CirclePatternParameters,
  LinePatternParameters,
  PositionDefinition,
  ObjectTemplate,
  ObjectDefinition,
  GroupDefinition,
  SceneDefinition
};
