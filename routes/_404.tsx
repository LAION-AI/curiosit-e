import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Article not found</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-white">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
            src="/logo-curiosit-e.png"
            width="128"
            height="128"
            alt="Curiosit-E Logo"
          />
          <h1 class="text-4xl font-bold">404 - Article not found</h1>
          <p class="my-4">
            The article you were looking for doesn't exist.
          </p>
          <a href="/articles" class="underline">Go to articles home</a>
        </div>
      </div>
    </>
  );
}
