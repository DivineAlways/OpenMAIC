'use client';

import { useEffect, useState, ReactNode } from 'react';
import { GraduationCap, Lock } from 'lucide-react';

const MAIN_SITE = 'https://onlycrypto.io';

function MembersOnlyWall() {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950 p-6">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center">
          <Lock className="w-9 h-9 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">
              OC Academy
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Members Only</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            OC Academy is an exclusive benefit for active OnlyCrypto members. Activate your
            membership to unlock all courses and certifications.
          </p>
        </div>
        <a
          href={`${MAIN_SITE}/dashboard/learning`}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl transition-colors"
        >
          Go to OnlyCrypto
        </a>
        <p className="text-xs text-gray-600">
          Already a member?{' '}
          <a href={`${MAIN_SITE}/dashboard/learning`} className="text-blue-500 hover:text-blue-400">
            Sign in at onlycrypto.io
          </a>{' '}
          and click &ldquo;Start Learning&rdquo;.
        </p>
      </div>
    </div>
  );
}

export function AccessCodeGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<{
    enabled: boolean;
    authenticated: boolean;
    loading: boolean;
  }>({ enabled: false, authenticated: false, loading: true });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/access-code/status')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setStatus({
            enabled: data.enabled,
            authenticated: data.authenticated,
            loading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ enabled: true, authenticated: false, loading: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status.loading) return null;
  if (status.enabled && !status.authenticated) return <MembersOnlyWall />;
  return <>{children}</>;
}
