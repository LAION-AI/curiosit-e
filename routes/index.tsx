// Redirect the home page to the articles page
export default function Home(_req: Request) {
  return new Response(null, {
    status: 307, // Temporary redirect
    headers: {
      Location: "/articles",
    },
  });
}
