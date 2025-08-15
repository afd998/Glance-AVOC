import React from 'react';
import Footer from './Footer';
import { useBackground } from '../hooks/useBackground';

const Layout = ({ children }) => {
  const { currentBackground } = useBackground();
  
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background image - moved here to prevent re-rendering during navigation */}
             <div 
         className="fixed inset-0 -z-10 bg-white dark:bg-gray-900"
         style={{
           backgroundImage: currentBackground ? `url('/${currentBackground}')` : 'none',
           backgroundSize: "cover",
           backgroundRepeat: "no-repeat",
           backgroundPosition: "center",
           filter: currentBackground ? "blur(8px)" : "none",
           transform: "translateZ(0)"
         }}
         id="parallax-background"
       />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 
