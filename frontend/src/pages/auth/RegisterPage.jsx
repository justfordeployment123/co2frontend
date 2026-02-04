import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff, Globe } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    language: 'en',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      const result = await register({
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        country_code: 'US',
        industry: null,
      });

      if (result.success) {
        navigate('/login');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight-navy flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight-navy via-primary-light to-midnight-navy" />
        <div className="absolute top-1/3 -left-1/4 w-[500px] h-[500px] bg-growth-green/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 -right-1/4 w-[500px] h-[500px] bg-cyan-mist/10 rounded-full blur-[120px]" />

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <Link to="/" className="mb-12">
            <img src="/aurixon_logo.png" alt="Aurixon" className="h-14 w-auto" />
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">
            Start Your Journey to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist to-growth-green">
              Carbon Neutrality
            </span>
          </h1>

          <p className="text-gray-400 text-lg mb-8 max-w-md">
            Join hundreds of European SMEs using Aurixon to automate their ESG reporting and achieve CSRD compliance.
          </p>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            <StepIndicator number={1} active={step >= 1} completed={step > 1} label="Company Info" />
            <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-growth-green' : 'bg-white/10'}`} />
            <StepIndicator number={2} active={step >= 2} completed={step > 2} label="Account Setup" />
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <img src="/aurixon_logo.png" alt="Aurixon" className="h-12 w-auto mx-auto mb-4" />
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-mist hover:text-growth-green transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Mobile Progress */}
          <div className="lg:hidden flex items-center gap-4 mb-6">
            <StepIndicator number={1} active={step >= 1} completed={step > 1} label="Info" small />
            <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-growth-green' : 'bg-white/10'}`} />
            <StepIndicator number={2} active={step >= 2} completed={step > 2} label="Account" small />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      placeholder="Your company name"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-mist/50 focus:ring-1 focus:ring-cyan-mist/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="John"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-mist/50 focus:ring-1 focus:ring-cyan-mist/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Doe"
                      className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-mist/50 focus:ring-1 focus:ring-cyan-mist/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Language
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-mist/50 focus:ring-1 focus:ring-cyan-mist/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="en" className="bg-midnight-navy">English</option>
                      <option value="de" className="bg-midnight-navy">Deutsch</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-semibold rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Work Email
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
                      placeholder="Min. 8 characters"
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Re-enter your password"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-mist/50 focus:ring-1 focus:ring-cyan-mist/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3.5 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-semibold rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Creating account...</span>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
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

const StepIndicator = ({ number, active, completed, label, small }) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className={`${small ? 'w-8 h-8 text-sm' : 'w-10 h-10'} rounded-full flex items-center justify-center font-semibold transition-all ${
        completed
          ? 'bg-growth-green text-white'
          : active
          ? 'bg-cyan-mist/20 text-cyan-mist border-2 border-cyan-mist'
          : 'bg-white/5 text-gray-500 border border-white/10'
      }`}
    >
      {completed ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        number
      )}
    </div>
    <span className={`text-xs ${active ? 'text-cyan-mist' : 'text-gray-500'}`}>{label}</span>
  </div>
);

export default RegisterPage;
