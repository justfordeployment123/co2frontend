import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Shield, BarChart3, ArrowRight, Leaf, Globe } from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-midnight-navy flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-midnight-navy/95 backdrop-blur-lg shadow-lg border-b border-cyan-mist/10'
          : 'bg-transparent'
      }`}>
        <div className="container-custom mx-auto">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <img
                src="/aurixon_logo.png"
                alt="Aurixon"
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how-it-works">How it Works</NavLink>
              <NavLink href="#about">About</NavLink>

              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary px-6 py-2.5 rounded-full flex items-center gap-2 group">
                  Dashboard
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">
                    Log In
                  </Link>
                  <Link to="/register" className="btn-primary px-6 py-2.5 rounded-full flex items-center gap-2 group">
                    Get Started
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-midnight-navy/95 backdrop-blur-lg border-t border-cyan-mist/10 px-4 py-6 space-y-4">
            <MobileNavLink href="#features" onClick={() => setMobileMenuOpen(false)}>Features</MobileNavLink>
            <MobileNavLink href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</MobileNavLink>
            <MobileNavLink href="#about" onClick={() => setMobileMenuOpen(false)}>About</MobileNavLink>
            <div className="pt-4 space-y-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="block w-full text-center btn-primary py-3 rounded-lg">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="block w-full text-center btn-secondary py-3 rounded-lg">
                    Log In
                  </Link>
                  <Link to="/register" className="block w-full text-center btn-primary py-3 rounded-lg">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-growth-green/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-cyan-mist/8 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-compliance-blue/5 rounded-full blur-[200px]" />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(188,230,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(188,230,247,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative container-custom mx-auto py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-growth-green/10 border border-growth-green/20 mb-6 animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-growth-green animate-pulse" />
                <span className="text-sm text-growth-green font-medium">CSRD & ESG Compliant</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                AI-Powered
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist via-compliance-blue to-growth-green">
                  ESG Compliance
                </span>
                Made Simple
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Automate your carbon footprint calculations and ESG reporting with European Environment Agency accuracy. Built for SMEs navigating CSRD requirements.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                {isAuthenticated ? (
                  <Link to="/dashboard" className="btn-primary text-lg px-8 py-4 rounded-full shadow-lg shadow-growth-green/20 hover:shadow-growth-green/40 transition-all flex items-center justify-center gap-2 group">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary text-lg px-8 py-4 rounded-full shadow-lg shadow-growth-green/20 hover:shadow-growth-green/40 transition-all flex items-center justify-center gap-2 group">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link to="/login" className="btn-secondary text-lg px-8 py-4 rounded-full flex items-center justify-center gap-2">
                      View Demo
                    </Link>
                  </>
                )}
              </div>

              {/* Trust indicators */}
              <div className="mt-10 pt-8 border-t border-white/10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex flex-wrap justify-center lg:justify-start gap-8">
                  <TrustBadge number="500+" label="Companies" />
                  <TrustBadge number="99.9%" label="Accuracy" />
                  <TrustBadge number="24/7" label="Support" />
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block animate-fade-in-left" style={{ animationDelay: '0.3s' }}>
              <div className="relative">
                {/* Main dashboard mockup */}
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-cyan-mist/20 p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>

                  {/* Mock dashboard content */}
                  <div className="space-y-4">
                    <div className="h-8 bg-gradient-to-r from-cyan-mist/20 to-transparent rounded-lg w-3/4" />
                    <div className="grid grid-cols-3 gap-3">
                      <DashboardCard label="Scope 1" value="124.5" variant="cyan" />
                      <DashboardCard label="Scope 2" value="89.2" variant="green" />
                      <DashboardCard label="Scope 3" value="456.8" variant="blue" />
                    </div>
                    <div className="h-32 bg-gradient-to-t from-growth-green/20 to-transparent rounded-lg flex items-end justify-around px-4 pb-2">
                      {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                        <div key={i} className="w-6 bg-gradient-to-t from-growth-green to-cyan-mist rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />

        <div className="relative container-custom mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-mist/10 text-cyan-mist text-sm font-medium mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist to-growth-green"> ESG Excellence</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Built specifically for European businesses to meet CSRD requirements efficiently and accurately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Automated Calculations"
              description="Enter your activity data and our AI automatically calculates CO₂e using the latest EEA emission factors with precision."
              gradient="from-cyan-mist to-compliance-blue"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="CSRD Compliant Reports"
              description="Generate audit-ready reports aligned with Corporate Sustainability Reporting Directive standards instantly."
              gradient="from-growth-green to-forest-shade"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Complete Scope Coverage"
              description="Comprehensive tracking of Scope 1, 2 & 3 emissions including supply chain calculation modules."
              gradient="from-compliance-blue to-cyan-mist"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-growth-green/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative container-custom mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-growth-green/10 text-growth-green text-sm font-medium mb-4">
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in <span className="text-growth-green">Three Steps</span>
            </h2>
            <p className="text-gray-400 text-lg">
              From sign-up to compliance reports in minutes, not months.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-cyan-mist/30 to-transparent" />

            <StepCard
              number="01"
              title="Create Account"
              description="Sign up and set your company profile. Define reporting boundaries with our guided questionnaire."
            />
            <StepCard
              number="02"
              title="Enter Activities"
              description="Log your business activities—energy, travel, waste. Our AI matches the right emission factors automatically."
            />
            <StepCard
              number="03"
              title="Generate Reports"
              description="Get instant CSRD-compliant reports with actionable insights to reduce emissions and demonstrate compliance."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative">
        <div className="container-custom mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-mist/10 text-cyan-mist text-sm font-medium mb-4">
                About Aurixon
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Empowering Sustainable
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist to-growth-green"> Business Decisions</span>
              </h2>
              <p className="text-gray-400 text-lg mb-6">
                Aurixon is a climate-tech company on a mission to empower SMEs across Europe to take control of their carbon footprint. Our team combines expertise in sustainability, data science, and software engineering.
              </p>
              <p className="text-gray-400 text-lg mb-8">
                We believe every business, regardless of size, deserves access to accurate tools for measuring, managing, and reducing environmental impact. Aurixon is committed to transparency, innovation, and supporting the transition to a low-carbon economy.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <StatCard number="10K+" label="Emissions Tracked" />
                <StatCard number="98%" label="Customer Satisfaction" />
                <StatCard number="15+" label="EU Countries" />
                <StatCard number="50%" label="Avg. Cost Savings" />
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Abstract visual representing sustainability */}
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-cyan-mist/20 p-8 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {/* Orbital rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full border border-cyan-mist/20 animate-pulse-slow" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 rounded-full border border-growth-green/20 animate-pulse-slow" style={{ animationDelay: '1s' }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-80 h-80 rounded-full border border-compliance-blue/20 animate-pulse-slow" style={{ animationDelay: '2s' }} />
                    </div>

                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-growth-green to-forest-shade flex items-center justify-center shadow-lg shadow-growth-green/30">
                        <Leaf className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    {/* Floating nodes */}
                    <div className="absolute top-8 right-12 w-4 h-4 rounded-full bg-cyan-mist animate-float" />
                    <div className="absolute bottom-16 left-8 w-3 h-3 rounded-full bg-growth-green animate-float" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/3 left-16 w-2 h-2 rounded-full bg-compliance-blue animate-float" style={{ animationDelay: '2s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-growth-green/10 via-transparent to-cyan-mist/10" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-mist/30 to-transparent" />
        </div>

        <div className="relative container-custom mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Simplify Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist to-growth-green"> ESG Compliance?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join hundreds of European SMEs already using Aurixon to automate their carbon footprint reporting and meet CSRD requirements with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary text-lg px-8 py-4 rounded-full shadow-lg shadow-growth-green/20 hover:shadow-growth-green/40 transition-all flex items-center justify-center gap-2 group">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-4 rounded-full shadow-lg shadow-growth-green/20 hover:shadow-growth-green/40 transition-all flex items-center justify-center gap-2 group">
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg px-8 py-4 rounded-full flex items-center justify-center gap-2">
                    Schedule a Demo
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 mt-auto">
        <div className="container-custom mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/aurixon_logo.png" alt="Aurixon" className="h-8 w-auto" />
            </div>

            <div className="flex items-center gap-8 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
            </div>

            <div className="flex items-center gap-4">
              <SocialIcon href="https://linkedin.com" label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </SocialIcon>
              <SocialIcon href="https://twitter.com" label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </SocialIcon>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Aurixon. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Sub-components
const NavLink = ({ href, children }) => (
  <a
    href={href}
    className="text-gray-300 hover:text-white font-medium transition-colors relative group"
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-mist to-growth-green group-hover:w-full transition-all duration-300" />
  </a>
);

const MobileNavLink = ({ href, onClick, children }) => (
  <a
    href={href}
    onClick={onClick}
    className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
  >
    {children}
  </a>
);

const TrustBadge = ({ number, label }) => (
  <div className="text-center">
    <div className="text-2xl font-bold text-white">{number}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

const DashboardCard = ({ label, value, variant }) => {
  const variants = {
    cyan: { bg: 'bg-cyan-mist/10', text: 'text-cyan-mist' },
    green: { bg: 'bg-growth-green/10', text: 'text-growth-green' },
    blue: { bg: 'bg-compliance-blue/10', text: 'text-compliance-blue' },
  };
  const styles = variants[variant] || variants.cyan;
  return (
    <div className={`${styles.bg} rounded-lg p-3 text-center`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${styles.text}`}>{value}</div>
      <div className="text-xs text-gray-500">tCO₂e</div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, gradient }) => (
  <div className="group relative">
    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl" />
    <div className="relative bg-white/5 backdrop-blur-sm border border-cyan-mist/20 rounded-2xl p-8 hover:border-cyan-mist/40 transition-all duration-300 h-full">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-6 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

const StepCard = ({ number, title, description }) => (
  <div className="relative text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-mist/20 to-growth-green/20 border border-cyan-mist/30 mb-6">
      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist to-growth-green">
        {number}
      </span>
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const StatCard = ({ number, label }) => (
  <div className="bg-white/5 rounded-xl p-4 border border-cyan-mist/10">
    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-mist to-growth-green">
      {number}
    </div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

const SocialIcon = ({ href, label, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-all"
    aria-label={label}
  >
    {children}
  </a>
);

export default LandingPage;
