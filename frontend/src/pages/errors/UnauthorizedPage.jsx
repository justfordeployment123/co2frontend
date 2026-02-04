import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-midnight-navy flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-cyan-mist/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <ShieldOff className="w-12 h-12 text-red-400" />
        </div>

        {/* Error Code */}
        <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 mb-4">
          403
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>

        {/* Description */}
        <p className="text-gray-400 mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-cyan-mist to-growth-green text-midnight-navy font-semibold rounded-xl hover:shadow-lg hover:shadow-growth-green/20 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
