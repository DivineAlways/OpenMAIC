'use client';

import { useEffect } from 'react';

export default function ClassroomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ClassroomError]', error);
  }, [error]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center max-w-md px-6">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">This lesson failed to load</h2>
        <p className="text-gray-400 text-sm mb-2">{error?.message || 'An unexpected error occurred.'}</p>
        {error?.digest && (
          <p className="text-gray-600 text-xs mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-500"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700"
          >
            Back to Courses
          </a>
        </div>
      </div>
    </div>
  );
}
