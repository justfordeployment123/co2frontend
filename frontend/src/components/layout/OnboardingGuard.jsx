import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { boundariesAPI } from '../../api/boundariesAPI';
import Loading from '../common/Loading';

/**
 * Onboarding Guard Component
 * Redirects to /setup if user hasn't completed boundary questionnaire
 */
const OnboardingGuard = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [onboardingComplete, setOnboardingComplete] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const response = await boundariesAPI.getOnboardingStatus();
      // API returns { success: true, wizard_completed: boolean, ... }
      const wizardComplete = response?.wizard_completed === true;
      
      console.log('Onboarding status check:', { wizardComplete, response });
      
      if (wizardComplete) {
        setOnboardingComplete(true);
      } else {
        setOnboardingComplete(false);
        // Redirect to setup wizard
        console.log('Redirecting to /setup - wizard not completed');
        navigate('/setup', { replace: true });
      }
    } catch (err) {
      // First time user - no onboarding_status record yet, redirect to setup
      console.log('Onboarding check failed - redirecting to setup:', err);
      setOnboardingComplete(false);
      navigate('/setup', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      checkOnboardingStatus();
    }
  }, [authLoading, isAuthenticated, checkOnboardingStatus]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Checking onboarding status..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!onboardingComplete) {
    return null; // Will be redirected by useEffect
  }

  return children;
};

export default OnboardingGuard;
