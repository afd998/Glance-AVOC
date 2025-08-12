import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

// AppContent has been extracted to pages/HomePage.tsx as HomePage

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Layout>
              <Routes>
                <Route path="/auth" element={<LandingPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path=":date" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path=":date/:eventId/*" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path=":date/faculty" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path=":date/faculty/:facultyId" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
              </Routes>
            </Layout>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
} 