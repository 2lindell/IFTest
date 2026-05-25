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

3. Create `.env.local` based on `.env.example`
```bash
cp .env.example .env.local
```

4. Add your Supabase credentials to `.env.local`
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server
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

You'll need to create these tables in Supabase:

### world_objects
```sql
CREATE TABLE world_objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('object', 'location', 'character', 'rule')),
  properties JSONB DEFAULT '{}',
  parent_id UUID REFERENCES world_objects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### rules
```sql
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  condition TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

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

## Next Steps

1. Set up your Supabase project and create the database tables
2. Implement real-time subscriptions in Supabase
3. Add authentication
4. Create custom Inform 7 parser for natural language
5. Add export functionality

## License

MIT
