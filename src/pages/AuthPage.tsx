import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTodayPath } from '../utils/datePaths';
import { LoginForm } from '../components/login-form';
import LandingPageNavBar from '../components/LandingPageNavBar';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const { signInWithOtp, verifyOtp } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setMessage('Please enter your email address');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signInWithOtp(normalizedEmail);

      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        setMessage('Check your email for the verification code!');
        setMessageType('success');
        setOtpSent(true);
        setEmail(normalizedEmail);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!otpCode || otpCode.length !== 6) {
      setMessage('Please enter the 6-digit verification code');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.trim();

    try {
      const { error, session } = await verifyOtp(normalizedEmail, otpCode);

      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else if (session) {
        setMessage('Verification successful! Redirecting...');
        setMessageType('success');
        setTimeout(() => {
          navigate(getTodayPath());
        }, 1000);
      } else {
        setMessage('Verification failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (otpSent) {
      await handleVerifyOtp(e);
    } else {
      await handleSendOtp(e);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setMessage('');

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setMessage('Please enter your email address');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signInWithOtp(normalizedEmail);

      if (error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        setMessage('New verification code sent!');
        setMessageType('success');
        setEmail(normalizedEmail);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setOtpSent(false);
    setOtpCode('');
    setMessage('');
  };

  const handleOtpChange = (value: string) => {
    setOtpCode(value.replace(/\D/g, '').slice(0, 6));
  };

  return (
    <div className="w-full">
      <LandingPageNavBar  onLogin={handleLogin} />
      <div className=" grid min-h-svh bg-background text-foreground lg:grid-cols-2 w-full">
        <div className="w-full">
          <div className="w-full h-full">
            <div className="h-full flex flex-col gap-6 p-6 md:p-10">

              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-md space-y-8">
                  

                  <div className="space-y-6 rounded-3xl border border-border/40 bg-card p-8 shadow-xl shadow-primary/10">
                    <div className="text-center md:text-left">
                      <p className="text-base text-muted-foreground">
                        Sign in with your Northwestern email to receive a one-time verification code.
                      </p>
                    </div>

                    <LoginForm
                      onSubmit={handleSubmit}
                      email={email}
                      onEmailChange={setEmail}
                      isLoading={isLoading}
                      otpSent={otpSent}
                      otpCode={otpCode}
                      onOtpChange={handleOtpChange}
                      onResendOtp={otpSent ? handleResendOtp : undefined}
                      onBackToEmail={otpSent ? handleBackToEmail : undefined}
                      message={message}
                      messageType={messageType}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative hidden items-center justify-center overflow-hidden lg:flex">
          <img
            src="/auth.png"
            alt="AVOC auditorium"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/45 to-black/70 dark:from-black/70 dark:via-black/60 dark:to-black/85" />
          <div className="relative z-10 max-w-md space-y-4 p-10 text-white">
            <h2 className="text-4xl font-semibold leading-tight">
              Every session, every room, always within reach.
            </h2>
            <p className="text-lg text-white/80">
              AVOC keeps the team aligned on room schedules, task assignments, and faculty data so the
              Hub is always ready.
            </p>
          </div>
        </div>

      </div>

    </div>

  );
};

export default AuthPage;
