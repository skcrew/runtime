# Design Document

## Overview

The Documentation Engine is a sophisticated plugin-driven application built on Skeleton Crew Runtime that transforms markdown files into a fully-featured documentation website. The system leverages Skeleton Crew's core subsystems (Plugin Registry, Screen Registry, Action Engine, Event Bus) to create a modular, extensible documentation platform.

The architecture consists of three layers:
1. **Core Plugins**: Essential functionality (Router, Markdown Parser, Component Registry, UI Provider)
2. **Feature Plugins**: Enhanced capabilities (Sidebar, Search, Code Blocks, Theme, Playground, Versioning, Cache)
3. **Content Layer**: Markdown/MDX files that become documentation pages

The design emphasizes loose coupling through event-driven communication, allowing plugins to be swapped, extended, or removed without affecting other components. This demonstrates Skeleton Crew's capability to power complex, real-world applications beyond simple internal tools.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Skeleton Crew Runtime                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Plugin       │ Screen       │ Action       │ Event          │
│ Registry     │ Registry     │ Engine       │ Bus            │
└──────────────┴──────────────┴──────────────┴────────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Documentation Plugins                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Core         │ Feature      │ UI           │ Utility        │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ • Router     │ • Sidebar    │ • React UI   │ • Component    │
│ • Markdown   │ • Search     │ • Code Block │   Registry     │
│              │ • Theme      │ • Playground │ • Cache        │
│              │ • Versioning │              │ • Static Export│
└──────────────┴──────────────┴──────────────┴────────────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   Documentation Content  │
              │   (Markdown/MDX files)   │
              └──────────────────────────┘
```

### Plugin Initialization Sequence

```
1. Runtime.initialize()
   ↓
2. Register Component Registry Plugin (must be first)
   ↓
3. Register Router Plugin
   ↓
4. Register Markdown Plugin
   ↓
5. Register React UI Plugin
   ↓
6. Register Feature Plugins (order independent)
   - Sidebar Plugin
   - Search Plugin
   - Code Block Plugin
   - Theme Plugin
   - Playground Plugin
   - Versioning Plugin
   - Cache Plugin
   - Static Export Plugin
   ↓
7. Markdown Plugin scans docs/ directory
   ↓
8. For each .md/.mdx file:
   - Parse content
   - Extract frontmatter
   - Register as screen
   - Emit 'markdown:page-registered' event
   ↓
9. Router Plugin creates URL mappings
   ↓
10. Sidebar Plugin builds navigation tree
    ↓
11. Search Plugin indexes content
    ↓
12. Navigate to initial page
```

### Data Flow: User Searches for Content

```
1. User types "plugins" in search box
   ↓
2. UI calls action: search:query({ term: "plugins" })
   ↓
3. Search Plugin executes query against index
   ↓
4. Search Plugin emits event: search:results({ term, results })
   ↓
5. Sidebar Plugin listens, highlights matching pages
   ↓
6. UI displays results
   ↓
7. User clicks first result
   ↓
8. UI calls action: router:navigate({ path: "/guides/plugins" })
   ↓
9. Router Plugin emits event: router:navigated({ path, screenId })
   ↓
10. UI Plugin renders screen
    ↓
11. Code Block Plugin highlights syntax
    ↓
12. Cache Plugin stores rendered output
```

### Data Flow: Markdown File Processing

```
docs/getting-started.md
   ↓
Markdown Plugin.setup()
   ↓
scanDirectory('docs/')
   ↓
readFile('docs/getting-started.md')
   ↓
parseMarkdown(content)
   ├─ Extract frontmatter (title, path, order)
   ├─ Extract headings (for TOC)
   ├─ Identify code blocks (language, content)
   └─ Identify MDX components (<Callout>, <Playground>)
   ↓
context.screens.registerScreen({
  id: 'getting-started',
  title: 'Getting Started',
  component: 'MarkdownPage',
  metadata: { path, frontmatter, headings, content }
})
   ↓
context.events.emit('markdown:page-registered', { id, metadata })
   ↓
Router Plugin: routes.set('/getting-started', 'getting-started')
Sidebar Plugin: navigationTree.add({ id, title, order })
Search Plugin: searchIndex.add({ id, title, content, headings })
   ↓
User navigates to /getting-started
   ↓
Router Plugin: screenId = routes.get('/getting-started')
   ↓
UI Plugin: screen = context.screens.getScreen(screenId)
   ↓
Render markdown content with MDX components
   ↓
Component Registry resolves <Callout> → CalloutComponent
   ↓
Display page to user
```

## Components and Interfaces

### Core Plugin Interfaces

#### Router Plugin

```typescript
interface RouterPlugin extends PluginDefinition {
  name: 'router';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface RouteMap {
  path: string;      // URL path (e.g., '/getting-started')
  screenId: string;  // Screen identifier
}

// Actions
interface NavigateAction {
  id: 'router:navigate';
  params: { path: string };
  returns: { path: string; screenId: string };
}

interface BackAction {
  id: 'router:back';
  params: {};
  returns: { path: string; screenId: string };
}

interface ForwardAction {
  id: 'router:forward';
  params: {};
  returns: { path: string; screenId: string };
}

// Events
interface NavigatedEvent {
  type: 'router:navigated';
  data: { path: string; screenId: string };
}

interface NavigationErrorEvent {
  type: 'router:error';
  data: { path: string; error: string };
}
```

#### Markdown Plugin

```typescript
interface MarkdownPlugin extends PluginDefinition {
  name: 'markdown';
  version: '1.0.0';
  setup(context: RuntimeContext): Promise<void>;
}

interface MarkdownFile {
  id: string;           // Unique identifier (derived from path)
  path: string;         // File path relative to docs/
  name: string;         // File name without extension
  content: string;      // Raw markdown content
}

interface ParsedMarkdown {
  frontmatter: Frontmatter;
  headings: Heading[];
  content: MarkdownAST;
  codeBlocks: CodeBlock[];
  components: ComponentReference[];
}

interface Frontmatter {
  title?: string;
  description?: string;
  path?: string;
  order?: number;
  [key: string]: any;
}

interface Heading {
  level: number;        // 1-6
  text: string;
  id: string;          // Anchor ID
}

interface CodeBlock {
  language: string;
  code: string;
  meta?: string;       // e.g., "{1,3-5}" for line highlighting
}

interface ComponentReference {
  name: string;        // e.g., "Callout"
  props: Record<string, any>;
}

// Events
interface PageRegisteredEvent {
  type: 'markdown:page-registered';
  data: {
    id: string;
    metadata: ParsedMarkdown;
  };
}
```

#### Component Registry Plugin

```typescript
interface ComponentRegistryPlugin extends PluginDefinition {
  name: 'component-registry';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface ComponentRegistry {
  register(name: string, component: React.ComponentType<any>): void;
  get(name: string): React.ComponentType<any> | undefined;
  has(name: string): boolean;
  getAll(): Map<string, React.ComponentType<any>>;
}

// Exposed via context
interface RuntimeContextWithComponents extends RuntimeContext {
  componentRegistry: ComponentRegistry;
}
```

#### React UI Plugin

```typescript
interface ReactUIPlugin extends PluginDefinition {
  name: 'react-ui';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface UIComponents {
  Layout: React.ComponentType<LayoutProps>;
  Sidebar: React.ComponentType<SidebarProps>;
  SearchBar: React.ComponentType<SearchBarProps>;
  ThemeToggle: React.ComponentType<ThemeToggleProps>;
  MarkdownPage: React.ComponentType<MarkdownPageProps>;
}

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header: React.ReactNode;
}

interface SidebarProps {
  items: NavigationItem[];
  activeId: string;
  onNavigate: (path: string) => void;
}

interface SearchBarProps {
  onSearch: (term: string) => void;
  results: SearchResult[];
}

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

interface MarkdownPageProps {
  content: MarkdownAST;
  frontmatter: Frontmatter;
  headings: Heading[];
}
```

### Feature Plugin Interfaces

#### Sidebar Plugin

```typescript
interface SidebarPlugin extends PluginDefinition {
  name: 'sidebar';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface NavigationItem {
  id: string;
  title: string;
  path: string;
  order: number;
  children: NavigationItem[];
}

interface NavigationTree {
  root: NavigationItem[];
  flat: Map<string, NavigationItem>;
}

// Events listened to
// - 'markdown:page-registered': Add page to navigation
// - 'router:navigated': Update active page
```

#### Search Plugin

```typescript
interface SearchPlugin extends PluginDefinition {
  name: 'search';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  headings: string;
  path: string;
}

interface SearchResult {
  id: string;
  title: string;
  path: string;
  score: number;
  snippet: string;
}

// Actions
interface SearchQueryAction {
  id: 'search:query';
  params: { term: string };
  returns: SearchResult[];
}

// Events
interface SearchResultsEvent {
  type: 'search:results';
  data: { term: string; results: SearchResult[] };
}
```

#### Code Block Plugin

```typescript
interface CodeBlockPlugin extends PluginDefinition {
  name: 'code-block';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface CodeBlockComponent {
  language: string;
  code: string;
  showLineNumbers: boolean;
  highlightLines?: number[];
  theme: 'light' | 'dark';
}

// Events listened to
// - 'theme:changed': Update syntax highlighting theme
```

#### Theme Plugin

```typescript
interface ThemePlugin extends PluginDefinition {
  name: 'theme';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

type Theme = 'light' | 'dark';

// Actions
interface ThemeToggleAction {
  id: 'theme:toggle';
  params: {};
  returns: { theme: Theme };
}

interface ThemeSetAction {
  id: 'theme:set';
  params: { theme: Theme };
  returns: { theme: Theme };
}

// Events
interface ThemeChangedEvent {
  type: 'theme:changed';
  data: { theme: Theme };
}
```

#### Playground Plugin

```typescript
interface PlaygroundPlugin extends PluginDefinition {
  name: 'playground';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface PlaygroundComponent {
  initialCode: string;
  presets?: PlaygroundPreset[];
  language: 'javascript' | 'typescript' | 'jsx' | 'tsx';
}

interface PlaygroundPreset {
  name: string;
  code: string;
}

interface PlaygroundState {
  code: string;
  error: Error | null;
  output: any;
}
```

#### Versioning Plugin

```typescript
interface VersioningPlugin extends PluginDefinition {
  name: 'versioning';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface VersionConfig {
  versions: Version[];
  default: string;
}

interface Version {
  id: string;
  label: string;
  path: string;
}

// Actions
interface VersionSwitchAction {
  id: 'version:switch';
  params: { versionId: string; currentPath: string };
  returns: { path: string };
}
```

#### Cache Plugin

```typescript
interface CachePlugin extends PluginDefinition {
  name: 'cache';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

interface CachedScreen {
  html: string;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
}

// Events
interface CacheHitEvent {
  type: 'cache:hit';
  data: { screenId: string };
}

interface CacheMissEvent {
  type: 'cache:miss';
  data: { screenId: string };
}
```

#### Static Export Plugin

```typescript
interface StaticExportPlugin extends PluginDefinition {
  name: 'static-export';
  version: '1.0.0';
  setup(context: RuntimeContext): void;
}

// Actions
interface ExportStaticAction {
  id: 'export:static';
  params: { outputDir: string };
  returns: { pages: number; errors: string[] };
}

interface ExportConfig {
  outputDir: string;
  assetsDir: string;
  includeAssets: boolean;
}
```

## Data Models

### Screen Metadata

```typescript
interface ScreenMetadata {
  path: string;                    // URL path
  frontmatter: Frontmatter;        // Parsed frontmatter
  headings: Heading[];             // Table of contents
  content: MarkdownAST;            // Parsed markdown AST
  codeBlocks: CodeBlock[];         // Extracted code blocks
  components: ComponentReference[]; // MDX components used
}
```

### Navigation Tree Structure

```typescript
interface NavigationTree {
  root: NavigationItem[];
  
  // Example structure:
  // [
  //   {
  //     id: 'getting-started',
  //     title: 'Getting Started',
  //     path: '/getting-started',
  //     order: 1,
  //     children: []
  //   },
  //   {
  //     id: 'guides',
  //     title: 'Guides',
  //     path: '/guides',
  //     order: 2,
  //     children: [
  //       {
  //         id: 'guides-plugins',
  //         title: 'Plugins',
  //         path: '/guides/plugins',
  //         order: 1,
  //         children: []
  //       }
  //     ]
  //   }
  // ]
}
```

### Search Index Structure

```typescript
interface SearchIndex {
  documents: SearchDocument[];
  
  // MiniSearch configuration
  config: {
    fields: ['title', 'content', 'headings'];
    storeFields: ['title', 'path', 'id'];
    searchOptions: {
      fuzzy: 0.2;
      prefix: true;
      boost: { title: 2, headings: 1.5 };
    };
  };
}
```

### Route Map Structure

```typescript
interface RouteMap {
  routes: Map<string, string>;
  
  // Example:
  // Map {
  //   '/' => 'index',
  //   '/getting-started' => 'getting-started',
  //   '/guides/plugins' => 'guides-plugins',
  //   '/api/runtime' => 'api-runtime'
  // }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties were identified as redundant or combinable:

- Properties for individual Callout types (13.3, 13.4, 13.5) can be combined into a single property about Callout rendering with different type props (13.2)
- Component resolution for Callout (13.1) is already covered by the general component resolution property (7.2)
- Desktop and tablet layout properties (12.4, 12.5) are visual design concerns, not testable properties
- Theme toggle behavior (6.1) can be expressed as an idempotence property
- Theme persistence (6.2, 6.3) can be combined into a single round-trip property

The following properties represent the unique, non-redundant validation requirements:

### Markdown Processing Properties

**Property 1: Markdown file registration**
*For any* markdown file placed in the docs directory, the Markdown Plugin should parse the file and register it as a screen in the Screen Registry
**Validates: Requirements 1.1**

**Property 2: Frontmatter extraction**
*For any* markdown file containing frontmatter with title, description, path, and order fields, the Markdown Plugin should extract all specified fields correctly
**Validates: Requirements 1.2**

**Property 3: Code block preservation**
*For any* markdown file containing code blocks with language specifications, the Markdown Plugin should preserve both the language information and code content exactly
**Validates: Requirements 1.3**

**Property 4: Heading hierarchy extraction**
*For any* markdown file containing headings, the Markdown Plugin should extract the complete heading hierarchy with correct levels and text
**Validates: Requirements 1.4**

### Router Properties

**Property 5: Path to screen mapping**
*For any* registered route mapping, when navigating to a URL path, the Router Plugin should return the corresponding screen identifier
**Validates: Requirements 2.1**

**Property 6: URL update without reload**
*For any* navigation action, the Router Plugin should update the browser URL without triggering a full page reload
**Validates: Requirements 2.2**

**Property 7: Browser history navigation**
*For any* sequence of navigation actions, using browser back and forward buttons should traverse the history in the correct order
**Validates: Requirements 2.3, 2.4**

**Property 8: Invalid path error handling**
*For any* invalid URL path not in the route map, the Router Plugin should return an error message without crashing
**Validates: Requirements 2.5**

### Sidebar Properties

**Property 9: Navigation tree construction**
*For any* set of registered screens, the Sidebar Plugin should build a navigation tree containing all screens
**Validates: Requirements 3.1**

**Property 10: Hierarchical organization**
*For any* set of screens with folder structure metadata, the Sidebar Plugin should organize them hierarchically matching the folder structure
**Validates: Requirements 3.2**

**Property 11: Active page highlighting**
*For any* navigation to a page, the Sidebar Plugin should highlight the active page in the navigation tree
**Validates: Requirements 3.3**

**Property 12: Order-based sorting**
*For any* set of pages with order metadata, the Sidebar Plugin should sort items according to the specified order values
**Validates: Requirements 3.4**

**Property 13: Alphabetical fallback sorting**
*For any* set of pages without order metadata, the Sidebar Plugin should sort items alphabetically by title
**Validates: Requirements 3.5**

### Search Properties

**Property 14: Page indexing**
*For any* markdown page registered, the Search Plugin should index the page with title, content, and headings fields
**Validates: Requirements 4.1**

**Property 15: Search query matching**
*For any* search query, the Search Plugin should return only pages that match the query terms, ranked by relevance
**Validates: Requirements 4.2**

**Property 16: Search result format**
*For any* search result returned, it should contain page title, path, and content snippet fields
**Validates: Requirements 4.3**

**Property 17: Search result navigation**
*For any* search result selected, the system should navigate to the corresponding page path
**Validates: Requirements 4.4**

### Code Block Properties

**Property 18: Syntax highlighting application**
*For any* code block with a language specification, the Code Block Plugin should apply syntax highlighting for that language
**Validates: Requirements 5.1**

**Property 19: Line number display**
*For any* code block rendered, the system should display line numbers
**Validates: Requirements 5.2**

**Property 20: Copy button display**
*For any* code block, hovering should display a copy-to-clipboard button
**Validates: Requirements 5.3**

**Property 21: Clipboard copy functionality**
*For any* code block, clicking the copy button should copy the exact code content to the clipboard
**Validates: Requirements 5.4**

**Property 22: Theme-aware syntax highlighting**
*For any* theme change, the Code Block Plugin should update syntax highlighting colors to match the new theme
**Validates: Requirements 5.5**

### Theme Properties

**Property 23: Theme toggle idempotence**
*For any* theme state, toggling twice should return to the original theme (light → dark → light, or dark → light → dark)
**Validates: Requirements 6.1**

**Property 24: Theme persistence round-trip**
*For any* theme selection, saving to local storage and then loading should preserve the exact theme value
**Validates: Requirements 6.2, 6.3**

**Property 25: Theme change event emission**
*For any* theme change, the Theme Plugin should emit a theme:changed event with the new theme value
**Validates: Requirements 6.4**

### Component Registry Properties

**Property 26: MDX component identification**
*For any* markdown file containing MDX component syntax, the Markdown Plugin should identify all component references
**Validates: Requirements 7.1**

**Property 27: Component name resolution**
*For any* registered component, the Component Registry should resolve the component name to its implementation
**Validates: Requirements 7.2**

**Property 28: Missing component error handling**
*For any* unregistered component reference, the system should display an error message indicating the missing component name
**Validates: Requirements 7.3**

**Property 29: Component availability after registration**
*For any* component registered by a plugin, the Component Registry should make it available for use in all markdown files
**Validates: Requirements 7.4**

**Property 30: Component prop passing**
*For any* component with props, the system should pass all props to the component implementation correctly
**Validates: Requirements 7.5**

### Playground Properties

**Property 31: Real-time preview updates**
*For any* code edit in the playground, the preview should update to reflect the changes
**Validates: Requirements 8.2**

**Property 32: Error handling without crashes**
*For any* playground code that throws an error, the system should display the error message without crashing the page
**Validates: Requirements 8.3**

**Property 33: Playground state preservation**
*For any* playground code modification, navigating away and returning within the session should preserve the modified code
**Validates: Requirements 8.5**

### Versioning Properties

**Property 34: Version selector display**
*For any* version configuration, the version selector should display all available versions with their labels
**Validates: Requirements 9.2**

**Property 35: Version switching navigation**
*For any* version switch, the system should navigate to the equivalent page path in the selected version
**Validates: Requirements 9.3**

**Property 36: Missing page fallback**
*For any* page that doesn't exist in the selected version, the system should navigate to the version homepage
**Validates: Requirements 9.4**

### Static Export Properties

**Property 37: Complete screen export**
*For any* set of registered screens, the static export should render all screens to HTML files
**Validates: Requirements 10.1**

**Property 38: Path structure preservation**
*For any* screen with a URL path, the exported HTML file should be placed in a directory structure matching the URL path
**Validates: Requirements 10.2**

**Property 39: Asset copying**
*For any* static export, all assets in the assets directory should be copied to the output directory
**Validates: Requirements 10.3**

**Property 40: Export completion reporting**
*For any* static export, the system should report the number of pages generated matching the number of registered screens
**Validates: Requirements 10.4**

**Property 41: Export error resilience**
*For any* screen that fails to render during export, the system should log the error and continue exporting remaining screens
**Validates: Requirements 10.5**

### Event System Properties

**Property 42: Page registration event emission**
*For any* markdown page registered, the Markdown Plugin should emit a markdown:page-registered event with complete page metadata
**Validates: Requirements 11.1**

**Property 43: Navigation event emission**
*For any* navigation action, the Router Plugin should emit a router:navigated event with path and screen identifier
**Validates: Requirements 11.2**

**Property 44: Search results event emission**
*For any* search query execution, the Search Plugin should emit a search:results event with matching pages
**Validates: Requirements 11.3**

**Property 45: Theme change event emission**
*For any* theme change, the Theme Plugin should emit a theme:changed event with the new theme value
**Validates: Requirements 11.4**

**Property 46: Event delivery to all listeners**
*For any* event emitted, the Event Bus should deliver the event to all registered listeners for that event type
**Validates: Requirements 11.5**

### Responsive UI Properties

**Property 47: Mobile menu navigation**
*For any* page selection from the mobile menu, the system should close the menu and navigate to the selected page
**Validates: Requirements 12.3**

### Callout Properties

**Property 48: Callout type-based styling**
*For any* Callout component with a type prop (info, warning, error), the system should display appropriate icon and styling for that type
**Validates: Requirements 13.2**

### Cache Properties

**Property 49: Screen caching with timestamp**
*For any* screen rendered, the Cache Plugin should store the rendered output with a timestamp
**Validates: Requirements 14.1**

**Property 50: Cached content serving**
*For any* screen request, if cached content exists and is not expired, the Cache Plugin should serve the cached content
**Validates: Requirements 14.2**

**Property 51: Cache hit event emission**
*For any* cached content served, the Cache Plugin should emit a cache:hit event
**Validates: Requirements 14.3**

**Property 52: Cache expiration and refresh**
*For any* cached content that has expired, the system should re-render the screen and update the cache
**Validates: Requirements 14.4**

**Property 53: LRU cache eviction**
*For any* cache that exceeds the size limit, the system should evict the least recently used entries
**Validates: Requirements 14.5**

### Build-Time Optimization Properties

**Property 54: Build-time markdown parsing**
*For any* static export build, the system should parse all markdown files during the build process
**Validates: Requirements 15.1**

**Property 55: Parsed content serialization round-trip**
*For any* parsed markdown content, serializing to JSON and deserializing should produce equivalent content
**Validates: Requirements 15.2**

**Property 56: Pre-parsed content loading**
*For any* site load with pre-parsed content, the system should load the pre-parsed content without invoking the markdown parser
**Validates: Requirements 15.3**

**Property 57: Bundle size reduction**
*For any* build using pre-parsed content, the bundle size should be smaller than a build including the markdown parser
**Validates: Requirements 15.4**

## Error Handling

### Plugin Initialization Errors

**Component Registry Missing**: If the Component Registry Plugin is not registered before other plugins that depend on it, the system should throw a clear error indicating the dependency requirement.

**Router Not Initialized**: If navigation is attempted before the Router Plugin is initialized, the system should throw an error indicating the router is not ready.

**Markdown Parse Errors**: If a markdown file contains invalid syntax, the Markdown Plugin should log the error with file path and line number, skip that file, and continue processing other files.

### Runtime Errors

**Missing Component**: When rendering a page with an unregistered MDX component, display an error message in place of the component showing the component name and available components.

**Invalid Route**: When navigating to a path not in the route map, emit a router:error event and display a 404 page with suggestions for similar paths.

**Search Index Corruption**: If the search index becomes corrupted, rebuild the index from registered screens and log a warning.

**Cache Corruption**: If cached content cannot be deserialized, evict the corrupted entry, re-render the screen, and log a warning.

**Playground Execution Errors**: When playground code throws an error, catch the error, display it in an error panel within the playground, and prevent it from crashing the page.

### Build Errors

**Export Rendering Failure**: If a screen fails to render during static export, log the error with screen ID and stack trace, add to error report, and continue exporting remaining screens.

**Asset Copy Failure**: If an asset cannot be copied during export, log the error with file path, add to error report, and continue with remaining assets.

**Serialization Failure**: If parsed markdown cannot be serialized to JSON, log the error with file path, skip that file, and continue with remaining files.

### Error Recovery Strategies

**Graceful Degradation**: When a feature plugin fails to initialize, log the error and continue with remaining plugins, allowing core functionality to work.

**Retry Logic**: For transient errors (network requests, file system operations), implement exponential backoff retry up to 3 attempts.

**Error Boundaries**: Wrap each plugin's UI components in React error boundaries to prevent one plugin's errors from crashing the entire application.

**Fallback Content**: When content cannot be loaded, display a fallback message with troubleshooting steps rather than a blank page.

## Testing Strategy

### Dual Testing Approach

The Documentation Engine will use both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Tagging Convention**: Each property-based test must be tagged with a comment explicitly referencing the correctness property in the design document using this format:
```typescript
// Feature: documentation-engine, Property 1: Markdown file registration
```

**Property Test Organization**: Property tests will be organized in the `tests/property/` directory with subdirectories for each plugin:
```
tests/property/
├── markdown/
│   ├── file-registration.property.test.ts
│   ├── frontmatter-extraction.property.test.ts
│   └── code-block-preservation.property.test.ts
├── router/
│   ├── path-mapping.property.test.ts
│   └── history-navigation.property.test.ts
├── sidebar/
│   ├── tree-construction.property.test.ts
│   └── sorting.property.test.ts
└── ...
```

**Generator Strategy**: Write smart generators that constrain to the input space intelligently:
- Markdown generators should produce valid markdown with various structures
- Path generators should produce valid URL paths
- Component generators should produce valid React component references
- Theme generators should produce only 'light' or 'dark' values

### Unit Testing

**Framework**: Vitest

**Unit Test Organization**: Unit tests will be organized in the `tests/unit/` directory mirroring the plugin structure:
```
tests/unit/
├── plugins/
│   ├── router.test.ts
│   ├── markdown.test.ts
│   ├── sidebar.test.ts
│   ├── search.test.ts
│   └── ...
└── components/
    ├── Layout.test.tsx
    ├── Sidebar.test.tsx
    └── ...
```

**Unit Test Coverage**:
- Plugin initialization and setup
- Action handler logic
- Event listener behavior
- Component rendering
- Error handling paths
- Edge cases (empty inputs, boundary values)

### Integration Testing

**Integration Test Organization**: Integration tests will be in `tests/integration/`:
```
tests/integration/
├── plugin-communication.test.ts
├── navigation-flow.test.ts
├── search-integration.test.ts
└── static-export.test.ts
```

**Integration Test Coverage**:
- Cross-plugin communication via events
- End-to-end user flows (search → navigate → render)
- Plugin initialization sequence
- Static export pipeline

### Test Execution Strategy

**Development**: Run unit tests in watch mode for rapid feedback
```bash
npm run test:watch
```

**Pre-commit**: Run all unit tests and fast property tests
```bash
npm test
```

**CI/CD**: Run full test suite including all property tests with maximum iterations
```bash
npm run test:ci
```

### Performance Testing

**Metrics to Track**:
- Markdown parsing time per file
- Search query response time
- Screen rendering time
- Cache hit rate
- Static export time per page

**Performance Benchmarks**:
- Markdown parsing: < 50ms per file
- Search query: < 100ms for 1000 pages
- Screen rendering: < 200ms
- Cache hit rate: > 80%
- Static export: < 1s per page

## Implementation Notes

### Plugin Load Order

The plugin initialization order is critical for correct operation:

1. **Component Registry** - Must be first so other plugins can register components
2. **Router** - Must be before Markdown so routes can be created as pages are registered
3. **Markdown** - Scans and registers all pages, triggering events for other plugins
4. **React UI** - Provides rendering layer
5. **Feature Plugins** - Order independent, listen to events from core plugins

### Event-Driven Architecture Benefits

The event-driven design provides several advantages:

- **Loose Coupling**: Plugins don't directly depend on each other
- **Extensibility**: New plugins can listen to existing events without modifying core plugins
- **Testability**: Events can be mocked and verified in tests
- **Debugging**: Event logs provide clear audit trail of system behavior

### Performance Optimizations

**Lazy Loading**: Feature plugins (Playground, Versioning) can be loaded on-demand when first needed.

**Code Splitting**: Bundle plugins separately so users only download what they use.

**Caching Strategy**: Implement multi-level caching:
- Memory cache for frequently accessed screens
- LocalStorage cache for session persistence
- Service worker cache for offline support

**Search Index Optimization**: For large documentation sites, split search index by section and load on-demand.

### Deployment Considerations

**Static Export**: The primary deployment target is static site generation for hosting on CDNs (Netlify, Vercel, GitHub Pages).

**Build Process**:
1. Initialize runtime and plugins
2. Markdown plugin registers all pages
3. Execute static export action
4. Generate HTML for each screen
5. Copy assets to output directory
6. Generate search index JSON
7. Create sitemap.xml

**Output Structure**:
```
dist/
├── index.html
├── getting-started.html
├── guides/
│   └── plugins.html
├── assets/
│   ├── styles.css
│   └── bundle.js
├── search-index.json
└── sitemap.xml
```

### Future Enhancements

**Incremental Builds**: Only rebuild changed pages instead of full site rebuild.

**Hot Module Replacement**: Update pages in development without full page reload.

**Algolia Search Plugin**: Alternative search implementation using Algolia service.

**i18n Plugin**: Multi-language support with language switcher.

**Analytics Plugin**: Track page views and search queries.

**PDF Export Plugin**: Generate PDF documentation from markdown files.
