# Overview

VideoScribe is a Video-to-Ebook SaaS application that transforms YouTube videos into professional documents using AI-powered content structuring. The system extracts video transcripts, processes them with OpenAI's GPT models, and generates beautifully formatted documents in various formats including ebooks, tutorials, guides, and recipes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for fast development and optimized builds
- **UI System**: Shadcn/UI components with Radix UI primitives for accessible, customizable interface elements
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for consistent theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live progress tracking during document processing

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Replit Auth integration with session-based authentication using connect-pg-simple for session storage
- **Job Processing**: Bull queue system with Redis for asynchronous video processing tasks
- **AI Integration**: OpenAI API (GPT-5) for content analysis and document structuring
- **File Generation**: Puppeteer for HTML-to-PDF conversion and document rendering

## Database Design
- **Primary Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Management**: Drizzle migrations with TypeScript schema definitions
- **Core Tables**: 
  - Users table with plan-based limits and usage tracking
  - Documents table for generated content storage
  - Jobs table for processing status and progress tracking
  - Sessions table for authentication state management

## Processing Pipeline
- **Video Analysis**: YouTube URL validation and metadata extraction
- **Transcript Extraction**: Automated caption retrieval from YouTube videos
- **AI Structuring**: Content analysis and organization using OpenAI's language models
- **Template Rendering**: HTML template processing with dynamic content injection
- **Document Generation**: Multi-format output generation (HTML, PDF) with professional styling

## Real-time Communication
- **WebSocket Server**: Built-in WebSocket support for live progress updates
- **Progress Tracking**: Real-time job status updates with percentage completion
- **Error Handling**: Comprehensive error reporting and user notification system

# External Dependencies

## Core Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **OpenAI API**: GPT-5 language model for content analysis and document structuring
- **YouTube API**: Video metadata and transcript extraction capabilities
- **Redis**: In-memory data store for job queue management and caching

## Authentication & Session Management
- **Replit Auth**: OAuth-based authentication system integrated with Replit platform
- **Session Storage**: PostgreSQL-backed session management with automatic cleanup

## Frontend Libraries
- **UI Components**: Radix UI primitives with Shadcn/UI component system
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for relative time formatting
- **Form Management**: React Hook Form with Zod validation schemas

## Development & Build Tools
- **Build System**: Vite with TypeScript support and hot module replacement
- **Code Quality**: TypeScript for type safety across the entire application
- **Styling**: PostCSS with Tailwind CSS and Autoprefixer
- **Package Management**: npm with lock file for dependency consistency