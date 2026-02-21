'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/';

  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: 'signin' | 'signup') {
    setMode(next);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: authError } =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);

    if (authError) {
      setError(authError);
      setSubmitting(false);
      return;
    }

    router.push(returnTo);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="max-w-sm mx-auto w-full mt-24 px-4">
        <div className="bg-gray-900 rounded-2xl p-6">
          <h1 className="text-xl font-semibold text-white mb-6">
            {mode === 'signin' ? 'Welcome to TipTurf' : 'Create your account'}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-800 text-white rounded-xl px-4 py-3 w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="password"
              placeholder="Password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-800 text-white rounded-xl px-4 py-3 w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
            >
              {submitting
                ? 'Please wait…'
                : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'signin' ? (
              <p className="text-sm text-gray-500">
                No account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
