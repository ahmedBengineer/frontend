"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export interface InterruptEdgeData {
  resume?: boolean;
}

export function InterruptEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.2,
  });

  const edgeData = data as InterruptEdgeData | undefined;
  const resume = edgeData?.resume;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: "#f59e0b", strokeWidth: 1.5, strokeDasharray: "5 4" }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "none",
          }}
        >
          <div className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-amber-600 ring-1 ring-amber-200 shadow-sm">
            ⚡{resume ? " resumes" : ""}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
