import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight-navy flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight-navy via-primary-light to-midnight-navy" />
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-growth-green/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-cyan-mist/10 rounded-full blur-[120px]" />

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <Link to="/" className="mb-12">
            <img src="/aurixon_logo.png" alt="Aurixon" className="h-14 w-auto" />
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist to-growth-green">
              ESG Command Center
            </span>
          </h1>

          <p className="text-gray-400 text-lg mb-8 max-w-md">
            Track, measure, and reduce your carbon footprint with precision. CSRD compliance made simple.
          </p>

          <div className="space-y-4">
            <FeatureItem text="Automated emission calculations" />
            <FeatureItem text="CSRD-compliant reporting" />
            <FeatureItem text="Real-time sustainability insights" />
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <img src="/aurixon_logo.png" alt="Aurixon" className="h-12 w-auto mx-auto mb-4" />
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to your account</h2>
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-mist hover:text-growth-green transition-colors font-medium">
                Get started
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-mist/50 focus:ring-1 focus:ring-cyan-mist/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-mist/50 focus:ring-1 focus:ring-cyan-mist/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-600 bg-white/5 text-growth-green focus:ring-growth-green/50"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-cyan-mist hover:text-growth-green transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-semibold rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }) => (
  <div className="flex items-center gap-3">
    <div className="w-6 h-6 rounded-full bg-growth-green/20 flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-growth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span className="text-gray-300">{text}</span>
  </div>
);

export default LoginPage;
