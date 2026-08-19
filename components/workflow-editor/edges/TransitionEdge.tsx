"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export interface TransitionEdgeData {
  label?: string;
  fullLabel?: string;
  badgeType?: string;
}

const DOT_COLOR: Record<string, string> = {
  START: "#14b8a6",
  PROMPT: "#818cf8",
  CONFIRM: "#f59e0b",
  SUCCESS: "#10b981",
};

export function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  // Use a small curvature so vertical straight lines stay straight,
  // but slightly offset connections get a gentle curve instead of a sharp step.
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.15,
  });

  const edgeData = data as TransitionEdgeData | undefined;
  const badgeType = edgeData?.badgeType ?? "PROMPT";
  const dotColor = DOT_COLOR[badgeType] ?? DOT_COLOR.PROMPT;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: "#cbd5e1", strokeWidth: 1.5 }}
      />
      {/* A single small coloured dot at the midpoint — clean, not noisy */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{ background: dotColor }}
            className="h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm"
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
