import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <main class="mx-auto p-4 text-center">
      <h1 class="my-16 text-6xl font-thin uppercase">Not Found</h1>
      <p class="my-4">
        <A href="/" class="text-sky-600 hover:underline">
          Back to Home
        </A>
      </p>
    </main>
  );
}
