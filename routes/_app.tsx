import type { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
	return (
		<html lang="en" className="dark:bg-gray-900">
			<Head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Curiosit-e</title>
				<link rel="stylesheet" href="/styles.css" />
				<script id="theme-script" type="text/javascript">
					{`
						// On page load or when changing themes, best to add inline in \`head\` to avoid FOUC
						if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
							document.documentElement.classList.add('dark')
						} else {
							document.documentElement.classList.remove('dark')
						}
					`}
				</script>
			</Head>
			<body className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
				<Component />
			</body>
		</html>
	);
}
