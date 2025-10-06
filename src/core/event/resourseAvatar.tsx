import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { renderResourceIcon } from '../../utils/eventUtils';

interface ResourceAvatarProps {
  resourceName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ResourceAvatar: React.FC<ResourceAvatarProps> = ({
  resourceName,
  size = 'sm',
  className = ''
}) => {
  // Get the resource icon component
  const resourceIcon = renderResourceIcon(resourceName);
  
  // Check if it's an image (Zoom icon) or an icon component
  const isImage = React.isValidElement(resourceIcon) && resourceIcon.type === 'img';
  
  if (isImage) {
    // For images (like Zoom icon), use AvatarImage
    return (
      <Avatar size={size} className={className}>
        <AvatarImage 
          src={resourceIcon.props.src} 
          alt={resourceIcon.props.alt}
        />
        <AvatarFallback>
          {resourceIcon.props.alt?.charAt(0) || 'R'}
        </AvatarFallback>
      </Avatar>
    );
  } else {
    // For icon components, use AvatarFallback with the icon
    return (
      <Avatar size={size} className={className}>
        <AvatarFallback className="bg-transparent">
          {resourceIcon}
        </AvatarFallback>
      </Avatar>
    );
  }
};

export default ResourceAvatar;
