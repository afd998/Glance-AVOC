import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSectionOne from '../components/hero-section-demo-1';
import { useAuth } from '../contexts/AuthContext';
import { getTodayPath } from '../utils/datePaths';
import LandingPageNavBar from '../components/LandingPageNavBar';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (user) {
      navigate(getTodayPath(), { replace: true });
    }
  }, [user, navigate]);



  const handleLogin = () => {
    navigate('/auth');
  };

  const handleReadProposal = () => {
    window.open("https://avoc-proposal.vercel.app", "_blank");
  };

  return (
    <div className="relative min-h-screen w-full  flex flex-col">
      <LandingPageNavBar onLogin={handleLogin} />
      <div className="w-full mt-24">
        <HeroSectionOne
          isDarkMode={isDarkMode}
          onLogin={handleLogin}

        /></div>
    </div>
  );
};

export default LandingPage;
