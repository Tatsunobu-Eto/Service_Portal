"use client";

import { DepartmentWithChildren } from "@/serverside/types";
import { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronDown, Search } from "lucide-react";

interface DepartmentTreeProps {
  departments: DepartmentWithChildren[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DepartmentTree({ departments, selectedId, onSelect }: DepartmentTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // 検索フィルタリングロジック
  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;

    const filterNodes = (nodes: DepartmentWithChildren[]): DepartmentWithChildren[] => {
      return nodes.reduce((acc: DepartmentWithChildren[], node) => {
        const matches = node.name.toLowerCase().includes(searchTerm.toLowerCase());
        const childMatches = node.children ? filterNodes(node.children) : [];

        if (matches || childMatches.length > 0) {
          acc.push({
            ...node,
            children: childMatches,
            _isExpanded: true 
          } as any);
        }
        return acc;
      }, []);
    };

    return filterNodes(departments);
  }, [departments, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="部署名で検索..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {filteredDepartments.length > 0 ? (
          filteredDepartments.map((dept) => (
            <TreeNode 
              key={dept.id} 
              node={dept} 
              selectedId={selectedId} 
              onSelect={onSelect} 
              depth={0} 
              defaultExpanded={(dept as any)._isExpanded}
            />
          ))
        ) : (
          <div className="py-8 text-center text-gray-400 text-sm">
            一致する部署が見つかりませんでした
          </div>
        )}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  depth,
  defaultExpanded = false
}: {
  node: DepartmentWithChildren;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth: number;
  defaultExpanded?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;

  // 検索結果が変わった時に展開状態を同期させる
  useEffect(() => {
    if (defaultExpanded) {
      setIsOpen(true);
    }
  }, [defaultExpanded]);

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-200 mb-0.5 ${
          isSelected 
            ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
            : "hover:bg-blue-50 text-gray-700"
        }`}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        onClick={() => onSelect(node.id)}
      >
        <span
          className={`mr-1 p-1 rounded-md transition-colors ${
            isSelected ? "hover:bg-blue-500" : "hover:bg-gray-200"
          }`}
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }
          }}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown size={14} strokeWidth={2.5} />
            ) : (
              <ChevronRight size={14} strokeWidth={2.5} />
            )
          ) : (
            <div className="w-3.5" />
          )}
        </span>
        <span className={`text-sm ${isSelected ? "font-bold" : "font-medium"}`}>
          {node.name}
        </span>
      </div>
      {hasChildren && isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {(node.children as DepartmentWithChildren[]).map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
