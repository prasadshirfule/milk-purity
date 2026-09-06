import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Milk, Eye, EyeOff, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('operator@amritdairy.com');
  const [password, setPassword] = useState('dairy2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Use demo credentials or click 1-Click Demo Login.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-screen flex bg-slate-900 overflow-hidden font-sans">
      {/* Left visual hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-dairy-950 p-12 flex-col justify-between border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-dairy-500 to-teal-400 text-white shadow-lg shadow-dairy-500/30">
            <Milk className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white block">MILK PURITY</span>
            <span className="text-xs font-semibold text-dairy-400 tracking-wider uppercase block">
              Smart IoT & Dairy Management
            </span>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dairy-500/10 border border-dairy-500/20 text-dairy-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Smart Dairy OS
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Precision Quality Assurance for Every Drop of Milk.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Real-time IoT telemetry from ESP32 sensors, instantaneous multi-parameter adulteration detection, automated farmer payouts, and ML purity classification.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-dairy-400 shrink-0" />
              <span>Multi-sensor analytics: pH, Fat, Density, Temperature, EC</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-dairy-400 shrink-0" />
              <span>Direct farmer ledger & instant transparent rate computation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-dairy-400 shrink-0" />
              <span>Ready for hardware ESP32 streaming & Python ML models</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © 2026 Smart Dairy Systems • Amrit Dairy Collection Division
        </div>
      </div>

      {/* Right Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-900">
        <div className="w-full max-w-md space-y-8 bg-slate-950/80 p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="text-center sm:text-left">
            <div className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-dairy-500 to-teal-400 text-white shadow-lg mb-4">
              <Milk className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Station Operator Login</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to access testing dock telemetry and dairy accounting.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@amritdairy.com"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-dairy-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-dairy-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-dairy-600 focus:ring-dairy-500"
                />
                <span>Remember this terminal</span>
              </label>
              <a href="#reset" className="text-dairy-400 hover:underline font-semibold">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-bold shadow-lg shadow-dairy-600/30"
              isLoading={isLoading}
            >
              Sign In to Terminal
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-3 text-slate-500 font-semibold">Instant Evaluation</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleDemoLogin}
            className="w-full bg-slate-900/60 border-slate-700 hover:bg-slate-800 text-slate-200"
            icon={<Sparkles className="w-4 h-4 text-amber-400" />}
          >
            1-Click Demo Operator Login
          </Button>
        </div>
      </div>
    </div>
  );
};
