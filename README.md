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

![Nota Preview](https://www.nota.ink/previews/dark.webp)

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

## 💡 Philosophy

> **Nota is designed to be the nimble sports car of note-taking—fast, precise, and enjoyable to drive—stripping away the bloat while keeping the power where it matters.**

I love writing and taking notes, but I struggled to find a tool that felt *just right*. Apps like Notion and Obsidian are powerful, but often feel like driving a semi-truck when all you need is a sedan—feature-rich, but heavy and sluggish due to their Electron roots. On the other hand, lightweight alternatives often lack the polish or specific UI finesse I craved.

**Nota strikes a balance:**

- **Lightweight & Efficient**: Weighing in at roughly ~16MB post-installation on macOS, Nota respects your system's resources (CPU, Memory, Energy) far more than typical web-wrapper applications.
- **Purposeful AI**: AI is a tool, not a subscription trap. While features like solving complex calculus problems or summarizing notes are invaluable, paying $20/month per service is unsustainable. Nota adopts a **Bring Your Own Key (BYOK)** model (or non-expiring credits), giving you first-class AI powers without the recurring costs.

It's built for those who want the fluid editing experience of Notion without the weight, and the simplicity of plain text with the superpowers of modern AI.

## 📥 Installation

You can download the latest version of Nota from the [Releases page](https://github.com/Tsuzat/Nota/releases).

### macOS

#### Homebrew (Recommended)

Just open your terminal and run the following command to install Nota using Homebrew:

```sh
brew install --cask Tsuzat/tap/nota
```

#### Manual Download

> [!WARNING]
>
> We do not have an Apple Developer ID, so the application is not signed with an Apple Developer ID. As a result, you may encounter a warning when trying to open it.
>
> **Note:** This warning is a security feature to alert users that the app is not from a verified developer or application is damaged. In that case run the following command to remove the quarantine check from the app.
>
> ```sh
> xattr -r -d com.apple.quarantine /Applications/Nota.app
> ```

1. Download the `.dmg` file.
2. Open the `.dmg` and drag **Nota** to your **Applications** folder.
3. Open **Nota** from the Applications folder.
4. If you see a warning saying _"Nota" can't be opened because it is from an unidentified developer_:
   - Click **OK**.
   - Go to **System Settings** > **Privacy & Security**.
   - Scroll down to the **Security** section.
   - You should see a message about "Nota" being blocked. Click **Open Anyway**.
   - Enter your password if prompted.

**Tip:** You can also right-click (or Control-click) the app icon and select **Open**, then click **Open** in the dialog box to bypass the check.

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
