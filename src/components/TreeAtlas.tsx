import { ATLAS_TREE_BUBBLE_CAP } from "../lib/safeGraphLimits";
import type { TreeSummary } from "../lib/researchSelectors";
import type { TreeConnection } from "../lib/treeConnectionSelectors";
import { SciFiTreeBubble } from "./SciFiTreeBubble";
import { TreeConnectionLayer } from "./TreeConnectionLayer";

interface Props {
  trees: TreeSummary[];
  connections: TreeConnection[];
  onOpenTree: (treeId: string, rootNodeId: string) => void;
}

const preferredPositions = [
  { x: 50, y: 28 },
  { x: 26, y: 68 },
  { x: 74, y: 68 },
  { x: 20, y: 28 },
  { x: 82, y: 28 }
];

function atlasPosition(index: number) {
  if (index < preferredPositions.length) return preferredPositions[index];
  const ring = Math.floor((index - preferredPositions.length) / 8);
  const slot = (index - preferredPositions.length) % 8;
  const radiusX = 34 + ring * 8;
  const radiusY = 28 + ring * 6;
  const angle = -Math.PI / 2 + (Math.PI * 2 * slot) / 8;
  return {
    x: Math.max(10, Math.min(90, 50 + Math.cos(angle) * radiusX)),
    y: Math.max(16, Math.min(84, 50 + Math.sin(angle) * radiusY))
  };
}

export function TreeAtlas({ trees, connections, onOpenTree }: Props) {
  const visibleTrees = trees.slice(0, ATLAS_TREE_BUBBLE_CAP);
  const positions = new Map(visibleTrees.map((tree, index) => [tree.id, atlasPosition(index)]));
  return (
    <section className="tree-atlas graph-wrap">
      <div className="atlas-heading">
        <div>
          <p className="eyebrow">Atlas View</p>
          <h2>Research Trees</h2>
        </div>
        <span>{visibleTrees.length} trees</span>
      </div>
      <div className="tree-atlas-map">
        <TreeConnectionLayer connections={connections} positions={positions} />
        {visibleTrees.map((tree) => {
          const position = positions.get(tree.id) ?? { x: 50, y: 50 };
          return <SciFiTreeBubble key={tree.id} tree={tree} x={position.x} y={position.y} onOpen={onOpenTree} />;
        })}
      </div>
    </section>
  );
}
