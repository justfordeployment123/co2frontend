import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff, Globe } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTranslation();
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
      setError(t('validation.required'));
      return false;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError(t('validation.required'));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError(t('validation.invalidEmail'));
      return false;
    }
    if (formData.password.length < 8) {
      setError(t('validation.minLength', { count: 8 }));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('validation.passwordMismatch'));
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
      setError(t('auth.regFailed'));
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
            <div className="inline-block bg-white/10 rounded-xl px-3 py-1">
              <img src={import.meta.env.BASE_URL + 'aurixon_logo.png'} alt="CalculateCO2" className="h-14 w-auto" />
            </div>
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">
            {t('auth.startJourney')}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist to-growth-green">
              {t('auth.carbonNeutrality')}
            </span>
          </h1>

          <p className="text-gray-400 text-lg mb-8 max-w-md">
            {t('auth.joinSMEs')}
          </p>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            <StepIndicator number={1} active={step >= 1} completed={step > 1} label={t('auth.companyInfo')} />
            <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-growth-green' : 'bg-white/10'}`} />
            <StepIndicator number={2} active={step >= 2} completed={step > 2} label={t('auth.accountSetup')} />
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Language Switcher */}
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/">
              <div className="inline-block bg-white/10 rounded-xl px-3 py-1">
                <img src={import.meta.env.BASE_URL + 'aurixon_logo.png'} alt="CalculateCO2" className="h-12 w-auto mx-auto mb-4" />
              </div>
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{t('auth.createAccount')}</h2>
            <p className="text-gray-400">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-cyan-mist hover:text-growth-green transition-colors font-medium">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>

          {/* Mobile Progress */}
          <div className="lg:hidden flex items-center gap-4 mb-6">
            <StepIndicator number={1} active={step >= 1} completed={step > 1} label={t('auth.companyInfo')} small />
            <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-growth-green' : 'bg-white/10'}`} />
            <StepIndicator number={2} active={step >= 2} completed={step > 2} label={t('auth.accountSetup')} small />
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
                    {t('auth.companyName')}
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
                      {t('auth.firstName')}
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
                      {t('auth.lastName')}
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
                    {t('auth.preferredLanguage')}
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
                  <span>{t('auth.continue')}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('auth.email')}
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
                    {t('auth.password')}
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
                    {t('auth.confirmPassword')}
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
                    {t('auth.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-semibold rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>{t('auth.creatingAccount')}</span>
                    ) : (
                      <>
                        <span>{t('auth.createAccountButton')}</span>
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
              ← {t('auth.backToHome')}
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
