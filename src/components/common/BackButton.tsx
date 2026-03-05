
import React from 'react';
import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface BackButtonProps extends ButtonProps {
  to?: string; // Optional custom path, defaults to -1 (history back)
}

/**
 * Standardized Back Button for the application.
 * Uses outlined variant (or can be configured) with an Arrow icon.
 */
const BackButton: React.FC<BackButtonProps> = ({ to, onClick, children, ...props }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      startIcon={<ArrowLeft />} // Use Lucide icon to match other components
      onClick={handleClick}
      // You can enforce specific styling here if needed to be stricter than props
      sx={{ ...props.sx }}
      {...props}
    >
      {children || t('common.back')}
    </Button>
  );
};

export default BackButton;
