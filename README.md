# RunAI — AI Marketing Generator

A production-ready Next.js website for AI-powered marketing campaign generation. Users can input a detailed prompt about their business and receive a complete marketing package with campaign strategy, copy, content calendar, ad briefs, SEO keywords, and social media kit.

## Features

- **One-Click Campaign Generation**: Generate complete marketing campaigns from a single prompt
- **6 Output Modules**: Strategy, Copy, Content Calendar, Ad Briefs, SEO Keywords, Social Media Kit
- **Beautiful Dark UI**: Modern glassmorphism design with custom color palette
- **Streaming AI Integration**: Real-time content generation using Claude Sonnet
- **Export Options**: Download results as TXT or Markdown
- **Copy to Clipboard**: Quick copy functionality for each section
- **Responsive Design**: Fully responsive across mobile, tablet, and desktop

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Font**: League Spartan from Google Fonts
- **Language**: TypeScript
- **AI**: Anthropic Claude Sonnet API
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API Key from [console.anthropic.com](https://console.anthropic.com)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with your API key:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/
  page.tsx                    # Landing page
  generate/page.tsx           # AI generation page
  api/generate/route.ts       # Claude API endpoint
  layout.tsx                  # Root layout
  globals.css                 # Global styles & design tokens

components/
  ui/                         # Reusable UI components
    Button.tsx
    Card.tsx
    Container.tsx
    Input.tsx, Textarea.tsx
    Tabs.tsx
    Badge.tsx
  layout/                     # Layout components
    Navbar.tsx
    Footer.tsx
  features/                   # Feature-specific components
    PromptInput.tsx
    OutputViewer.tsx
    LoadingState.tsx
    FeatureCard.tsx
    PricingCard.tsx

lib/
  types.ts                    # TypeScript type definitions

tailwind.config.ts            # Tailwind configuration with design tokens
```

## Design System

### Colors

- **Background**: `#000000` (pure black)
- **Primary**: `#D572E0` (purple)
- **Secondary**: `#26DED2` (teal)
- **Accent**: `#D9672E` (orange)
- **Foreground**: `#FFFFFF` (white)

### Typography

- **Font**: League Spartan
- **Sizes**: 72px (H1), 48px (H2), 32px (H3), 14.4px (Body Large), 12px (Body)

### Components

All components follow a dark-first, glassmorphic design pattern with subtle animations and color-coded glows.

## API Integration

The application uses the Anthropic Claude Sonnet model to generate marketing content. The API route:

- Accepts user prompts and category selection
- Parses XML-tagged output into structured sections
- Handles errors with user-friendly messages

## Usage

1. Navigate to `/generate`
2. Select a marketing category (Campaign, Social Media, Email, etc.)
3. Write a detailed prompt about your business
4. Click "Generate Now"
5. View results in tabbed sections
6. Copy individual sections or download complete output

## Features Checklist

- ✅ League Spartan font loaded via `next/font/google`
- ✅ All colors using CSS variables and Tailwind config
- ✅ Sticky glassmorphic navbar
- ✅ Animated hero background with gradient orbs
- ✅ Functional /generate page with real API calls
- ✅ Output parsed into tabs
- ✅ Copy to clipboard per section
- ✅ Fully responsive design
- ✅ Polish loading states
- ✅ User-friendly error handling
- ✅ TypeScript strict mode
- ✅ No authentication required (MVP)

## Environment Variables

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API key from [Anthropic Console](https://console.anthropic.com)
