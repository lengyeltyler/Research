import type { TreeConnection } from "../lib/treeConnectionSelectors";

interface AtlasPosition {
  x: number;
  y: number;
}

interface Props {
  connections: TreeConnection[];
  positions: Map<string, AtlasPosition>;
}

function curvePath(source: AtlasPosition, target: AtlasPosition) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const curve = Math.min(14, Math.max(7, Math.hypot(dx, dy) * 0.12));
  const c1 = { x: source.x + dx * 0.35, y: source.y + dy * 0.12 - curve };
  const c2 = { x: source.x + dx * 0.65, y: source.y + dy * 0.88 + curve };
  return `M ${source.x} ${source.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${target.x} ${target.y}`;
}

export function TreeConnectionLayer({ connections, positions }: Props) {
  return (
    <svg className="tree-connection-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {connections.map((connection) => {
        const source = positions.get(connection.sourceTreeId);
        const target = positions.get(connection.targetTreeId);
        if (!source || !target) return null;
        const label = `${connection.sourceTreeId} to ${connection.targetTreeId}: ${connection.count} links (${connection.labels.slice(0, 4).join(", ")})`;
        return (
          <g className="tree-link-group" key={connection.id}>
            <title>{label}</title>
            <path className="tree-link-path tree-link-glow" d={curvePath(source, target)} />
            <path className="tree-link-path" d={curvePath(source, target)} />
            <foreignObject x={(source.x + target.x) / 2 - 2.4} y={(source.y + target.y) / 2 - 2.4} width="4.8" height="4.8">
              <div className="tree-link-badge">{connection.count}</div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
