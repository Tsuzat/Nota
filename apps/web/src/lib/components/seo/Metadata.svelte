<script lang="ts">
interface Props {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  twitterCard?: string;
  keywords?: string;
}

let {
  title = 'Nota - Local-first AI Note Taking App',
  description = 'Nota is a fast, local-first note-taking app with AI integration. Create, organize, and edit your notes effortlessly with a modern, developer-friendly interface.',
  image = 'https://nota.ink/previews/dark.webp',
  url = 'https://nota.ink',
  type = 'website',
  twitterCard = 'summary_large_image',
  keywords = 'note taking, local first, ai notes, markdown editor, tauri, svelte, productivity',
}: Props = $props();

const siteTitle = 'Nota';
const fullTitle = $derived(title === siteTitle ? siteTitle : `${title} | ${siteTitle}`);
</script>

<svelte:head>
  <!-- Basic -->
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords} />
  <link rel="canonical" href={url} />
  <meta name="author" content="Nota Team" />
  <meta name="application-name" content="Nota" />
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={url} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={image} />
  <meta property="og:site_name" content={siteTitle} />

  <!-- Twitter -->
  <meta name="twitter:card" content={twitterCard} />
  <meta name="twitter:url" content={url} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />
  <meta name="twitter:creator" content="@tsuzat" /> 
</svelte:head>
