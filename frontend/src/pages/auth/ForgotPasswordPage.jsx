import { useState } from 'react';
import { Link } from 'react-router-dom';
import authAPI from '../../api/authAPI';

/**
 * Forgot Password Page
 * Request password reset link
 */
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
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: 'linear-gradient(135deg, #102035 0%, #1a3552 100%)'
      }}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <img 
            src="/aurixon_logo.png" 
            alt="AURIXON" 
            className="mx-auto h-16 w-auto"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h2 className="mt-6 text-3xl font-heading font-bold text-white">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-compliance-blue">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        {/* Reset Form */}
        <div className="card">
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Alert */}
              {error && (
                <div className="alert-error">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : (
            /* Success Message */
            <div className="text-center py-4">
              <div className="alert-success mb-4">
                Password reset link has been sent to your email!
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link to="/login" className="link text-sm">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
