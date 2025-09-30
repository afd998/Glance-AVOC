import React from 'react';

interface SnowOverlayProps {
  isEnabled: boolean;
}

const SnowOverlay: React.FC<SnowOverlayProps> = ({ isEnabled }) => {
  if (!isEnabled) return null;

  return (
    <div className="snow-overlay">
      <div className="snow"></div>
    </div>
  );
};

export default SnowOverlay;
