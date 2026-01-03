<div align="center">
  <img src="https://nota.ink/favicon.png" width="120" height="120" />
  <h1>Nota</h1>
  <p><strong>Fast, Lightweight, Feature-Rich Note-Taking App</strong></p>
  
  <p>
    <a href="https://github.com/Tsuzat/Nota/releases/latest"><img style="border-radius: 4px;" src="https://img.shields.io/github/v/release/Tsuzat/Nota?style=flat-square&logo=github" alt="Latest Release"></a>
    <img style="border-radius: 4px;" src="https://waka-api.dev-tsuzat.workers.dev/Nota" alt="Waka API" />
    <img style="border-radius: 4px;" src="https://img.shields.io/badge/built_with-Tauri_v2-blue?style=flat-square&logo=tauri" alt="Tauri v2" />
    <img style="border-radius: 4px;" src="https://img.shields.io/badge/built_with-Svelte_5-orange?style=flat-square&logo=svelte" alt="Svelte 5" />
  </p>

  <p>
    <a href="https://www.nota.ink/">Website</a> • 
    <a href="https://github.com/Tsuzat/Nota/releases">Download</a> • 
    <a href="#getting-started">Contributing</a>
  </p>
</div>

<br />

![Nota Preview](https://nota.ink/previews/dark.webp)

## ✨ Features

- **📝 Rich Text Editor**: Powered by a custom editor ("Edra") with support for:
  - Slash commands (`/`)
  - Markdown shortcuts
  - Media embeds (Images, Video, Audio)
  - Mathematical equations (KaTeX)
  - Tables & Task lists
- **🤖 AI Integration**: Built-in AI assistant for text generation, summarization, and more.
- **🚀 Cross-Platform**: Available as a lightweight Desktop app (macOS, Windows, Linux) and on the Web.
- **📂 Organization**: Hierarchical Workspaces and Notes structure.
- **🔐 Secure**: Custom authentication flow with session management.
- **⚡ Fast**: Built with Rust (Tauri) and Bun for blazing fast performance.
- **🎨 Modern UI**: Beautiful, responsive interface with Dark/Light mode support.

## 🛠️ Tech Stack

Nota is built as a monorepo using **Bun Workspaces**.

- **Frontend**: [Svelte 5](https://svelte.dev/), [SvelteKit](https://kit.svelte.dev/), [TailwindCSS](https://tailwindcss.com/), [Shadcn Svelte](https://www.shadcn-svelte.com/)
- **Desktop**: [Tauri v2](https://tauri.app/) (Rust)
- **Backend**: [Hono](https://hono.dev/), [Bun](https://bun.sh/)
- **Database**: [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/), [Redis](https://redis.io/)
- **Tooling**: [Biome](https://biomejs.dev/)

## 📂 Project Structure

```bash
├── apps
│   ├── backend    # Hono API server + Drizzle ORM
│   ├── desktop    # Tauri + SvelteKit desktop app
│   └── web        # SvelteKit landing page & web app
├── packages
│   ├── client     # Shared API client & types
│   └── ui         # Shared UI components & Editor
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (Runtime & Package Manager)
- [Rust](https://www.rust-lang.org/) (for Desktop app)
- [Docker](https://www.docker.com/) (optional, for local DB)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Tsuzat/Nota.git
   cd Nota
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` in `apps/backend`, `apps/web`, and `apps/desktop` and fill in the required values.

### Running Locally

**Backend**

```bash
cd apps/backend
bun dev
```

**Web App**

```bash
cd apps/web
bun dev
```

**Desktop App**

```bash
cd apps/desktop
bun tauri dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the NNCL License - see the [LICENSE](LICENSE) file for details. Using this software means you agree to the terms and conditions of the license.
