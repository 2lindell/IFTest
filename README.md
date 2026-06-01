# IFTest - Interactive Fiction World Builder

A React + TypeScript frontend for managing interactive fiction worlds with a Supabase backend.

## Features

- **World Objects**: Create and manage objects, locations, and characters
- **Rules System**: Define conditional rules and actions for your world
- **Live Preview**: See your world descriptions rendered in natural language
- **Real-time Sync**: Bidirectional synchronization with Supabase
- **Monaco Editor**: Code-like editing experience for Inform 7 style syntax
- **Hierarchical Organization**: Organize objects in parent-child relationships

## Getting Started

### Prerequisites
- Node.js 16+
- A Supabase project (https://supabase.com)

### Installation

1. Clone the repository
```bash
git clone https://github.com/2lindell/IFTest.git
cd IFTest
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/       # React components
│   ├── Editor.tsx    # Monaco editor for descriptions
│   ├── Preview.tsx   # Natural language preview
│   ├── ObjectTree.tsx # Hierarchical object browser
│   └── RulesList.tsx  # Rules management
├── lib/
│   ├── supabase.ts   # Supabase client setup
│   └── types.ts      # TypeScript type definitions
├── store/
│   └── worldStore.ts # Zustand state management
├── App.tsx           # Main app component
└── index.css         # Tailwind styles
```

## Database Schema



## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend/Database
- **Zustand** - State management
- **Monaco Editor** - Code editor
- **Lucide Icons** - Icons

## License

MIT
