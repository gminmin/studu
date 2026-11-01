'use client';

import React, { useMemo } from 'react';
import { VisualGuide } from '@/types/problem';
import { Shapes, Table as TableIcon, LineChart, Network } from 'lucide-react';

interface VisualRendererProps {
  visualGuide?: VisualGuide;
  className?: string;
}

export const VisualRenderer: React.FC<VisualRendererProps> = ({ visualGuide, className = '' }) => {
  const svgContent = visualGuide?.svgContent;
  const hasSvg = Boolean(svgContent && svgContent.includes('<svg'));
  const hasTable = Boolean(
    visualGuide?.tableData &&
      visualGuide.tableData.headers?.length > 0 &&
      visualGuide.tableData.rows?.length > 0
  );

  // SVG 코드 정제 (위험 스크립트 태그 제거 및 viewBox 확인)
  const sanitizedSvg = useMemo(() => {
    if (!svgContent) return '';
    let svg = svgContent.trim();
    // 마크다운 코드블록 제거 (```xml or ```svg)
    svg = svg.replace(/```(?:xml|svg|html)?/gi, '').replace(/```/g, '').trim();
    // script 태그 제거
    svg = svg.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

    // viewBox가 없는 경우 가로 세로를 viewBox로 보정
    if (!svg.includes('viewBox') && svg.includes('<svg')) {
      svg = svg.replace('<svg', '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet"');
    }
    return svg;
  }, [svgContent]);

  if (!visualGuide || visualGuide.type === 'none' || (!hasSvg && !hasTable)) return null;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-300 bg-white ${className}`}
    >
      {/* 헤더 바 */}
      <div className="flex items-center justify-between border-b border-slate-300 px-4 py-3">
        <div className="flex items-center gap-2">
          {visualGuide.type === 'geometry' && (
            <span className="rounded-md border border-slate-300 p-1 text-slate-900">
              <Shapes className="w-3.5 h-3.5" />
            </span>
          )}
          {visualGuide.type === 'graph' && (
            <span className="rounded-md border border-slate-300 p-1 text-slate-900">
              <LineChart className="w-3.5 h-3.5" />
            </span>
          )}
          {visualGuide.type === 'table' && (
            <span className="rounded-md border border-slate-300 p-1 text-slate-900">
              <TableIcon className="w-3.5 h-3.5" />
            </span>
          )}
          {visualGuide.type === 'diagram' && (
            <span className="rounded-md border border-slate-300 p-1 text-slate-900">
              <Network className="w-3.5 h-3.5" />
            </span>
          )}

          <span className="text-sm font-bold text-slate-900">
            {visualGuide.title || (
              visualGuide.type === 'geometry'
                ? '기하 도형 시각화'
                : visualGuide.type === 'graph'
                ? '함수 좌표 그래프'
                : visualGuide.type === 'table'
                ? '조건 및 데이터 분석표'
                : '원리 다이어그램'
            )}
          </span>
        </div>
        <span className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">AI 시각화</span>
      </div>

      {/* 1. SVG 도형 / 그래프 / 다이어그램 렌더링 */}
      {hasSvg && (
        <div className="flex flex-col items-center justify-center border-b border-slate-300 p-4">
          <div
            className="w-full max-w-sm flex items-center justify-center svg-container [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[220px] transition-all"
            dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
          />
        </div>
      )}

      {/* 2. 데이터 / 변수 분석표 렌더링 */}
      {hasTable && visualGuide.tableData && (
        <div className="p-3 overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead className="border-b border-slate-300 bg-white font-bold text-slate-900">
              <tr>
                {visualGuide.tableData.headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {visualGuide.tableData.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="px-3 py-3 text-base font-medium text-slate-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 하단 캡션 설명 */}
      {visualGuide.caption && (
        <div className="border-t border-slate-300 px-4 py-3 text-sm text-slate-700">
          {visualGuide.caption}
        </div>
      )}
    </div>
  );
};
