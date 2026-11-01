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

    // JSON의 \b 이스케이프가 잘못된 LaTeX 백슬래시와 합쳐진 경우 복구합니다.
    // 예: y=(g [backspace]igcirc f)(x) -> y=(g \bigcirc f)(x)
    const normalizedContent = content.replace(/\u0008(?=igcirc\b)/g, '\\');

    // 블록 전체가 수식인 경우
    if (block) {
      try {
        return katex.renderToString(normalizedContent.replace(/^\$\$|\$\$$/g, '').trim(), {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return normalizedContent;
      }
    }

    // 텍스트 내 $...$ 및 $$...$$ 파싱
    try {
      // 먼저 $$...$$ 블록 수식 치환
      let result = normalizedContent.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
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

      // 모델이 합성함수 표기를 LaTeX 구분자 없이 반환해도 수식으로 렌더링합니다.
      if (!result.includes('$') && /\\(?:bigcirc|circ)|∘/.test(result)) {
        result = result.replace(/(\by\s*=\s*\(?\s*[A-Za-z]\s*(?:\\bigcirc|\\circ|∘)\s*[A-Za-z]\s*\)?\s*\(\s*x\s*\))/g, (_, expression) =>
          katex.renderToString(expression.replace(/\\bigcirc/g, '\\circ'), { displayMode: false, throwOnError: false })
        );
      }

      return result;
    } catch {
      return normalizedContent;
    }
  }, [content, block]);

  return (
    <span
      className={`math-rendered-container inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
