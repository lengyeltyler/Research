import { ATLAS_TREE_BUBBLE_CAP } from "../lib/safeGraphLimits";
import type { TreeSummary } from "../lib/researchSelectors";
import type { TreeConnection } from "../lib/treeConnectionSelectors";
import { SciFiTreeBubble } from "./SciFiTreeBubble";

interface Props {
  trees: TreeSummary[];
  connections: TreeConnection[];
  onOpenTree: (treeId: string, rootNodeId: string) => void;
}

export function TreeAtlas({ trees, connections, onOpenTree }: Props) {
  const visibleTrees = trees.slice(0, ATLAS_TREE_BUBBLE_CAP);
  const visibleTreeIds = new Set(visibleTrees.map((tree) => tree.id));
  const visibleConnections = connections.filter((connection) => visibleTreeIds.has(connection.sourceTreeId) && visibleTreeIds.has(connection.targetTreeId));
  return (
    <section className="tree-atlas graph-wrap">
      <div className="atlas-heading">
        <div>
          <p className="eyebrow">Atlas View</p>
          <h2>Research Trees</h2>
        </div>
        <span>{visibleTrees.length} trees</span>
      </div>
      {visibleConnections.length > 0 && (
        <div className="atlas-connection-summary" aria-label="Tree-level research connections">
          {visibleConnections.slice(0, 8).map((connection) => (
            <span key={connection.id} title={connection.labels.join(", ")}>
              {connection.sourceTreeId.replaceAll("-", " ")} ↔ {connection.targetTreeId.replaceAll("-", " ")}
              <strong>{connection.count}</strong>
            </span>
          ))}
          {visibleConnections.length > 8 && <span>+{visibleConnections.length - 8} more</span>}
        </div>
      )}
      <div className="tree-atlas-map">
        {visibleTrees.map((tree) => <SciFiTreeBubble key={tree.id} tree={tree} onOpen={onOpenTree} />)}
      </div>
    </section>
  );
}
