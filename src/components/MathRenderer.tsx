'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  block?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  block = false,
}) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // 블록 전체가 수식인 경우
    if (block) {
      try {
        return katex.renderToString(content.replace(/^\$\$|\$\$$/g, '').trim(), {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return content;
      }
    }

    // 텍스트 내 $...$ 및 $$...$$ 파싱
    try {
      // 먼저 $$...$$ 블록 수식 치환
      let result = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return math;
        }
      });

      // $...$ 인라인 수식 치환 (단, 통화 기호 $100 등과 구별하기 위해 수식 패턴 매칭)
      result = result.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return math;
        }
      });

      return result;
    } catch {
      return content;
    }
  }, [content, block]);

  return (
    <span
      className={`math-rendered-container inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
