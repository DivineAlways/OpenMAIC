import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Access Required — OnlyCrypto Academy',
  description: 'OnlyCrypto Academy requires a Pro membership or standalone access.',
}

export default function LockedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">OnlyCrypto Academy</h1>
          <p className="text-sm text-gray-500 mt-1">by OnlyCrypto</p>
        </div>

        {/* Lock card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Members Only</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              OnlyCrypto Academy is an exclusive learning platform. Access is included with the
              OnlyCrypto <strong className="text-white">Pro membership</strong> — or available as a
              standalone purchase.
            </p>
          </div>

          {/* What's inside */}
          <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4 text-left space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">What&apos;s Inside</p>
            {[
              'XRP Momentum trading strategy — full course',
              'DeFi fundamentals + live protocol walkthroughs',
              'AI-powered interactive lessons (ask questions mid-lesson)',
              'OnlyCrypto City game — earn OC coin while learning',
              'Live trading sessions with Pro traders',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-gray-300">
                <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <a
              href="https://onlycrypto.io/auth/signup?ref=divinity2"
              className="block w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs py-3.5 text-center transition-colors"
            >
              Upgrade to Pro on OnlyCrypto →
            </a>
            <a
              href="https://onlycrypto.io/academy/access"
              className="block w-full rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-3.5 text-center transition-colors"
            >
              Buy Standalone Access — $49 (No OC membership needed)
            </a>
          </div>

          <p className="text-xs text-gray-600">
            Already a member?{' '}
            <a href="https://onlycrypto.io/dashboard" className="text-blue-400 hover:underline">
              Log in to OnlyCrypto
            </a>
            {' '}and click &quot;Enter Academy&quot;.
          </p>
        </div>
      </div>
    </div>
  )
}
