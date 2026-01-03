"use client";

import { DepartmentWithChildren } from "@/serverside/types";
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface DepartmentTreeProps {
  departments: DepartmentWithChildren[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DepartmentTree({ departments, selectedId, onSelect }: DepartmentTreeProps) {
  return (
    <div className="border rounded-md p-4 bg-white max-h-96 overflow-y-auto">
      {departments.map((dept) => (
        <TreeNode key={dept.id} node={dept} selectedId={selectedId} onSelect={onSelect} depth={0} />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  depth,
}: {
  node: DepartmentWithChildren;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        onClick={() => onSelect(node.id)}
      >
        <span
          className="mr-1 p-0.5 hover:bg-gray-200 rounded"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }
          }}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )
          ) : (
            <div className="w-4" />
          )}
        </span>
        <span className="text-sm font-medium">{node.name}</span>
      </div>
      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
