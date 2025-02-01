import { IntegratedSystem } from './integrated-system';
import { SceneDefinition } from './types';

////////////////////////////////////////////////////////////////
// Pattern Generation TODOs and Concerns
////////////////////////////////////////////////////////////////

// Point Patterns
// -------------
// Cube Pattern:
// - 現状の実装では角の部分で点が重複している
// - 重複を解消する場合、以下の方法を検討:
//   1. 角の部分を一度だけ生成
//   2. 重複を許容するが、描画時に半透明度を考慮
//   3. エッジの終点を少し内側にずらす

// Sphere Pattern:
// - 極付近で点が密集する問題
// - 対策として以下を検討:
//   1. 緯度に応じて経度方向の点数を調整
//   2. フィボナッチ球による均一な配置
//   3. 極付近の点の間引き

// Line Patterns
// -------------
// Grid Pattern:
// - 3D gridでの線の重なりの扱い
// - 描画順序による見え方の違い
// - 半透明度の適用方法

// General Concerns
// ---------------
// 1. パターン生成時のパフォーマンス
//    - 大量のオブジェクト生成時のメモリ使用
//    - 描画パフォーマンスの最適化

// 2. ID生成規則
//    - パターン内での個別オブジェクトの参照方法
//    - グループ化との整合性

////////////////////////////////////////////////////////////////
// Sample Usage
////////////////////////////////////////////////////////////////

const system = new IntegratedSystem();

// テストデータの定義
const sceneData: SceneDefinition = {
  "metadata": {
    "version": "1.0",
    "description": "Test scene with pattern-based objects"
  },
  "environment": {
    "axis": true,
    "camera": {
      "position": [-2, 4, 2],
      "type": "perspective"
    }
  },
  "objectDefinitions": [
    // Grid Pattern Test
    {
      "id": "points/grid/0",
      "type": "point",
      "count": 100,
      "template": {
        "size": 0.1,
        "rgba": "#ffffffff"
      },
      "positions": {
        "type": "pattern",
        "pattern": "grid",
        "parameters": {
          "spacing": 0.5,
          "dimensions": [10, 10, 1],
          "origin": [-2, -2, 0],
          "style": "plane"
        }
      }
    },
    // Circle Pattern Test
    {
      "id": "points/circle/0",
      "type": "point",
      "count": 36,
      "template": {
        "size": 0.1,
        "rgba": "#ff0000ff"
      },
      "positions": {
        "type": "pattern",
        "pattern": "circle",
        "parameters": {
          "radius": 2.0,
          "count": 36,
          "plane": "xy",
          "origin": [0, 0, 0]
        }
      }
    },
    // Cube Pattern Test
    {
      "id": "points/cube/0",
      "type": "point",
      "count": 8,
      "template": {
        "size": 0.1,
        "rgba": "#00ff00ff"
      },
      "positions": {
        "type": "pattern",
        "pattern": "cube",
        "parameters": {
          "edgeCount": 4,
          "size": 2.0,
          "origin": [-1, -1, -1]
        }
      }
    },
    // Line Grid Pattern Test
    {
      "id": "lines/grid/0",
      "type": "line",
      "count": 20,
      "template": {
        "size": "0.02x1.0",
        "rgba": "#0000ffff"
      },
      "positions": {
        "type": "pattern",
        "pattern": "grid",
        "parameters": {
          "spacing": 0.5,
          "dimensions": [5, 5, 1],
          "origin": [0, 0, 2],
          "style": "plane"
        }
      }
    }
  ],
  "groups": {
    "grid_points": {
      "type": "index",
      "generator": "points/grid/0",
      "idRange": [0, 99]
    },
    "circle_points": {
      "type": "index",
      "generator": "points/circle/0",
      "idRange": [0, 35]
    },
    "central_region": {
      "type": "spatial",
      "generator": "points/grid/0",
      "condition": {
        "region": "sphere",
        "center": [0, 0, 0],
        "radius": 1.0
      }
    }
  }
};

// シーンの読み込みと描画開始
system.loadFromJSON(sceneData);
system.animate();
