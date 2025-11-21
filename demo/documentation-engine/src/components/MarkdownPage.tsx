/**
 * MarkdownPage Component
 * 
 * Renders markdown content with MDX component resolution and table of contents.
 * 
 * @see Requirements 7.2, 7.5
 */

import React from 'react';
import type { Root } from 'mdast';
import type { Frontmatter, HeadingNode } from '../plugins/markdown.js';

export interface MarkdownPageProps {
  content: Root;
  frontmatter: Frontmatter;
  headings: HeadingNode[];
  componentRegistry?: {
    get(name: string): React.ComponentType<any> | undefined;
    getAll?(): Map<string, React.ComponentType<any>>;
  };
}

/**
 * MarkdownPage component
 * 
 * Renders parsed markdown content with MDX components and table of contents.
 * 
 * @see Requirements 7.2, 7.5
 */
export function MarkdownPage({
  content,
  frontmatter,
  headings,
  componentRegistry
}: MarkdownPageProps): JSX.Element {
  /**
   * Render markdown AST to React elements
   * This is a simplified renderer - a full implementation would use
   * a library like react-markdown or mdx-js/react
   */
  const renderContent = (node: any): React.ReactNode => {
    if (!node) return null;

    // Handle text nodes
    if (node.type === 'text') {
      return node.value;
    }

    // Handle paragraphs
    if (node.type === 'paragraph') {
      return (
        <p key={Math.random()}>
          {node.children?.map((child: any) => renderContent(child))}
        </p>
      );
    }

    // Handle headings
    if (node.type === 'heading') {
      const HeadingTag = `h${node.depth}` as keyof JSX.IntrinsicElements;
      const text = node.children
        ?.filter((child: any) => child.type === 'text')
        .map((child: any) => child.value)
        .join('');
      const id = text
        ?.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      return (
        <HeadingTag key={Math.random()} id={id}>
          {node.children?.map((child: any) => renderContent(child))}
        </HeadingTag>
      );
    }

    // Handle code blocks
    if (node.type === 'code') {
      return (
        <pre key={Math.random()}>
          <code className={`language-${node.lang || 'text'}`}>
            {node.value}
          </code>
        </pre>
      );
    }

    // Handle inline code
    if (node.type === 'inlineCode') {
      return <code key={Math.random()}>{node.value}</code>;
    }

    // Handle lists
    if (node.type === 'list') {
      const ListTag = node.ordered ? 'ol' : 'ul';
      return (
        <ListTag key={Math.random()}>
          {node.children?.map((child: any) => renderContent(child))}
        </ListTag>
      );
    }

    // Handle list items
    if (node.type === 'listItem') {
      return (
        <li key={Math.random()}>
          {node.children?.map((child: any) => renderContent(child))}
        </li>
      );
    }

    // Handle links
    if (node.type === 'link') {
      return (
        <a key={Math.random()} href={node.url}>
          {node.children?.map((child: any) => renderContent(child))}
        </a>
      );
    }

    // Handle emphasis
    if (node.type === 'emphasis') {
      return (
        <em key={Math.random()}>
          {node.children?.map((child: any) => renderContent(child))}
        </em>
      );
    }

    // Handle strong
    if (node.type === 'strong') {
      return (
        <strong key={Math.random()}>
          {node.children?.map((child: any) => renderContent(child))}
        </strong>
      );
    }

    // Handle MDX components
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (node.name && componentRegistry) {
        const Component = componentRegistry.get(node.name);
        
        if (Component) {
          // Extract props from attributes
          const props: Record<string, any> = {};
          if (node.attributes) {
            for (const attr of node.attributes) {
              if (attr.type === 'mdxJsxAttribute' && attr.name) {
                props[attr.name] = attr.value;
              }
            }
          }

          // Render children
          const children = node.children?.map((child: any) => renderContent(child));

          return (
            <Component key={Math.random()} {...props}>
              {children}
            </Component>
          );
        } else {
          // Component not found - display error
          const availableComponents = componentRegistry.getAll 
            ? Array.from(componentRegistry.getAll().keys()).join(', ')
            : 'none';
          
          return (
            <div key={Math.random()} className="component-error">
              <strong>Error:</strong> Component "{node.name}" not found in registry.
              <br />
              Available components: {availableComponents}
            </div>
          );
        }
      }
    }

    // Handle root and other container nodes
    if (node.children) {
      return node.children.map((child: any) => renderContent(child));
    }

    return null;
  };

  const hasToc = headings.length > 0;

  return (
    <div className="markdown-page">
      {/* Page header */}
      {frontmatter.title && (
        <header className="page-header">
          <h1 className="page-title">{frontmatter.title}</h1>
          {frontmatter.description && (
            <p className="page-description">{frontmatter.description}</p>
          )}
        </header>
      )}

      <div className="page-layout">
        {/* Main content */}
        <article className="page-content">
          {renderContent(content)}
        </article>

        {/* Table of contents */}
        {hasToc && (
          <aside className="page-toc">
            <nav aria-label="Table of contents">
              <h2 className="toc-title">On this page</h2>
              <ul className="toc-list">
                {headings.map((heading) => (
                  <li
                    key={heading.id}
                    className={`toc-item toc-level-${heading.level}`}
                  >
                    <a href={`#${heading.id}`} className="toc-link">
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}
      </div>

      <style>{`
        .markdown-page {
          width: 100%;
        }

        .page-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .page-title {
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--text-color, #1f2937);
          margin: 0 0 0.5rem 0;
        }

        .page-description {
          font-size: 1.125rem;
          color: var(--text-muted, #6b7280);
          margin: 0;
        }

        .page-layout {
          display: flex;
          gap: 2rem;
        }

        .page-content {
          flex: 1;
          min-width: 0;
          line-height: 1.7;
          color: var(--text-color, #374151);
        }

        .page-content h1,
        .page-content h2,
        .page-content h3,
        .page-content h4,
        .page-content h5,
        .page-content h6 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
          line-height: 1.3;
          color: var(--text-color, #1f2937);
        }

        .page-content h1 { font-size: 2rem; }
        .page-content h2 { font-size: 1.5rem; }
        .page-content h3 { font-size: 1.25rem; }
        .page-content h4 { font-size: 1.125rem; }
        .page-content h5 { font-size: 1rem; }
        .page-content h6 { font-size: 0.875rem; }

        .page-content p {
          margin: 1rem 0;
        }

        .page-content a {
          color: var(--link-color, #3b82f6);
          text-decoration: underline;
        }

        .page-content a:hover {
          color: var(--link-hover-color, #2563eb);
        }

        .page-content code {
          padding: 0.125rem 0.25rem;
          background: var(--code-bg, #f3f4f6);
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Courier New', monospace;
        }

        .page-content pre {
          padding: 1rem;
          background: var(--pre-bg, #1f2937);
          color: var(--pre-color, #f9fafb);
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        .page-content pre code {
          padding: 0;
          background: none;
          color: inherit;
        }

        .page-content ul,
        .page-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .page-content li {
          margin: 0.5rem 0;
        }

        .component-error {
          padding: 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          color: #991b1b;
          margin: 1rem 0;
        }

        .page-toc {
          width: 240px;
          flex-shrink: 0;
        }

        .toc-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-color, #1f2937);
          margin: 0 0 0.75rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .toc-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .toc-item {
          margin: 0.25rem 0;
        }

        .toc-level-1 { padding-left: 0; }
        .toc-level-2 { padding-left: 0.75rem; }
        .toc-level-3 { padding-left: 1.5rem; }
        .toc-level-4 { padding-left: 2.25rem; }
        .toc-level-5 { padding-left: 3rem; }
        .toc-level-6 { padding-left: 3.75rem; }

        .toc-link {
          display: block;
          padding: 0.25rem 0;
          font-size: 0.875rem;
          color: var(--text-muted, #6b7280);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .toc-link:hover {
          color: var(--link-color, #3b82f6);
        }

        /* Mobile: hide TOC */
        @media (max-width: 1024px) {
          .page-toc {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
