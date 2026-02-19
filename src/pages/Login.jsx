import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const Login = () => {
    const { login } = useApp();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await login();
            navigate('/');
        } catch (e) {
            setError('Failed to sign in. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-app)', padding: '1rem' }}>
            <div className="card text-center" style={{ maxWidth: '400px', width: '100%', padding: '3rem 2rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                    width: '64px', height: '64px', borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
                }}>
                    <Lock size={32} color="white" />
                </div>

                <h1 className="text-2xl text-bold mb-2">Welcome Back</h1>
                <p className="text-muted mb-4">Sign in to manage your ledger</p>

                {error && <div className="text-red text-sm mb-4">{error}</div>}

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '1rem' }}
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>

                <p className="text-xs text-muted mt-4">
                    Only authorized personnel of RKM Loom Spares can access this application.
                </p>
            </div>
        </div>
    );
};

export default Login;
