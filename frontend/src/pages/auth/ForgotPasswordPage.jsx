import { useState } from 'react';
import { Link } from 'react-router-dom';
import authAPI from '../../api/authAPI';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight-navy flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-growth-green/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-cyan-mist/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/aurixon_logo.png" alt="Aurixon" className="h-12 w-auto mx-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {!success ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-cyan-mist/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-cyan-mist" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Reset your password</h2>
                <p className="text-gray-400">
                  Enter your email and we'll send you instructions to reset your password.
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@company.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-mist/50 focus:ring-1 focus:ring-cyan-mist/50 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-semibold rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-growth-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-growth-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
              <p className="text-gray-400 mb-6">
                We've sent a password reset link to <span className="text-cyan-mist">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-cyan-mist hover:text-growth-green transition-colors"
                >
                  try again
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
