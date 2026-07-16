import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function GithubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      navigate('/login');
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/github/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });

        if (response.ok) {
          const data = await response.json();
          sessionStorage.setItem('neuralpatch_token', data.token);
          if (data.user) {
            sessionStorage.setItem('neuralpatch_user', JSON.stringify(data.user));
          }
          window.location.href = '/dashboard';
        } else {
          console.error('Failed to exchange code');
          navigate('/login');
        }
      } catch (error) {
        console.error('GitHub auth error:', error);
        navigate('/login');
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-cyber-primary animate-spin" />
        <h2 className="text-zinc-200 font-mono text-sm">Authenticating with GitHub...</h2>
      </div>
    </div>
  );
}
