export default function AdminPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">Coordinator panel</h1>
      <p className="max-w-md text-gray-600">
        This is where the AAA notice (PDF) will be uploaded and the water points reviewed before
        publishing them.
      </p>
      <span className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        Coming soon
      </span>
    </main>
  );
}
