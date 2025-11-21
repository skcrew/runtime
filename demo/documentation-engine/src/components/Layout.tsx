/**
 * Layout Component
 * 
 * Main responsive layout with sidebar, header, and content areas.
 * Handles mobile/desktop layouts with hamburger menu for mobile.
 * 
 * @see Requirements 12.1, 12.2, 12.5
 */

import React, { useState } from 'react';

export interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}

/**
 * Layout component with responsive design
 * 
 * Desktop: Persistent sidebar alongside content
 * Mobile: Hamburger menu with overlay sidebar
 * 
 * @see Requirements 12.1, 12.2, 12.5
 */
export function Layout({ children, sidebar, header }: LayoutProps): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="layout-header">
        {/* Mobile hamburger menu button */}
        <button
          className="hamburger-menu"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger-icon">
            {isMobileMenuOpen ? '✕' : '☰'}
          </span>
        </button>
        
        {header}
      </header>

      {/* Main content area */}
      <div className="layout-main">
        {/* Sidebar - Desktop: persistent, Mobile: overlay */}
        <aside
          className={`layout-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
          onClick={closeMobileMenu}
        >
          <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </aside>

        {/* Mobile overlay backdrop */}
        {isMobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}

        {/* Content area */}
        <main className="layout-content">
          {children}
        </main>
      </div>

      <style>{`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .layout-header {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--header-bg, #ffffff);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .hamburger-menu {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          color: var(--text-color, #1f2937);
        }

        .hamburger-icon {
          display: block;
          width: 24px;
          height: 24px;
          line-height: 24px;
          text-align: center;
        }

        .layout-main {
          display: flex;
          flex: 1;
          position: relative;
        }

        .layout-sidebar {
          width: 280px;
          background: var(--sidebar-bg, #f9fafb);
          border-right: 1px solid var(--border-color, #e5e7eb);
          overflow-y: auto;
          position: sticky;
          top: 73px;
          height: calc(100vh - 73px);
        }

        .sidebar-content {
          padding: 1rem;
        }

        .layout-content {
          flex: 1;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .mobile-overlay {
          display: none;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .hamburger-menu {
            display: block;
          }

          .layout-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            height: 100vh;
            z-index: 200;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
          }

          .layout-sidebar.mobile-open {
            transform: translateX(0);
          }

          .mobile-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 150;
          }

          .layout-content {
            padding: 1rem;
          }
        }

        /* Tablet styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          .layout-sidebar {
            width: 240px;
          }

          .layout-content {
            padding: 1.5rem;
          }
        }

        /* Desktop styles */
        @media (min-width: 1025px) {
          .layout-sidebar {
            width: 280px;
          }

          .layout-content {
            padding: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
