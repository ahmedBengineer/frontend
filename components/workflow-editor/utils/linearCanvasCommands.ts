import type {
  LinearEdge,
  LinearFlow,
  LinearNode,
} from "../types";

export interface LinearCanvasClipboard {
  nodes: Record<string, LinearNode>;
  edges: LinearEdge[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nextId(base: string, used: Set<string>): string {
  let candidate = `${base}_copy`;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}_copy_${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

export function deleteLinearSelection(
  flow: LinearFlow,
  nodeIds: Iterable<string>,
  edgeIds: Iterable<string>,
): LinearFlow {
  const deletedNodes = new Set(nodeIds);
  deletedNodes.delete(flow.entry_node_id);
  const deletedEdges = new Set(edgeIds);
  if (!deletedNodes.size && !deletedEdges.size) return flow;

  return {
    ...flow,
    nodes: Object.fromEntries(
      Object.entries(flow.nodes).filter(([id]) => !deletedNodes.has(id)),
    ),
    edges: flow.edges.filter(
      (edge) =>
        !deletedEdges.has(edge.id) &&
        !deletedNodes.has(edge.source) &&
        !deletedNodes.has(edge.target),
    ),
  };
}

export function copyLinearSelection(
  flow: LinearFlow,
  nodeIds: Iterable<string>,
): LinearCanvasClipboard | null {
  const selected = new Set(nodeIds);
  const nodes = Object.fromEntries(
    Object.entries(flow.nodes)
      .filter(([id, node]) => selected.has(id) && node.type !== "start")
      .map(([id, node]) => [id, clone(node)]),
  );
  const copiedIds = new Set(Object.keys(nodes));
  if (!copiedIds.size) return null;

  return {
    nodes,
    edges: flow.edges
      .filter(
        (edge) => copiedIds.has(edge.source) && copiedIds.has(edge.target),
      )
      .map(clone),
  };
}

export function pasteLinearSelection(
  flow: LinearFlow,
  clipboard: LinearCanvasClipboard,
  offset = { x: 40, y: 40 },
): { flow: LinearFlow; nodeIds: string[] } {
  const usedNodeIds = new Set(Object.keys(flow.nodes));
  const usedEdgeIds = new Set(flow.edges.map((edge) => edge.id));
  const nodeIdMap = new Map<string, string>();
  const pastedNodes: Record<string, LinearNode> = {};

  for (const [sourceId, sourceNode] of Object.entries(clipboard.nodes)) {
    if (sourceNode.type === "start") continue;
    const nodeId = nextId(sourceId, usedNodeIds);
    nodeIdMap.set(sourceId, nodeId);
    const node = clone(sourceNode);
    node.ui = {
      ...node.ui,
      position: {
        x: (node.ui?.position?.x ?? 0) + offset.x,
        y: (node.ui?.position?.y ?? 0) + offset.y,
      },
    };
    pastedNodes[nodeId] = node;
  }

  const pastedEdges = clipboard.edges.flatMap((sourceEdge) => {
    const source = nodeIdMap.get(sourceEdge.source);
    const target = nodeIdMap.get(sourceEdge.target);
    if (!source || !target) return [];
    const edge = clone(sourceEdge);
    edge.id = nextId(sourceEdge.id, usedEdgeIds);
    edge.source = source;
    edge.target = target;
    return [edge];
  });

  const nodeIds = Object.keys(pastedNodes);
  if (!nodeIds.length) return { flow, nodeIds };
  return {
    flow: {
      ...flow,
      nodes: { ...flow.nodes, ...pastedNodes },
      edges: [...flow.edges, ...pastedEdges],
    },
    nodeIds,
  };
}
