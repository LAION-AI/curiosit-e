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
			</Head>
			<body className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
				<Component />
			</body>
		</html>
	);
}
