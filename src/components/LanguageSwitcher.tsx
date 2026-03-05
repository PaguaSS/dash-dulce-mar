import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Menu, MenuItem, Avatar, Box } from '@mui/material';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  // Get current language code (e.g. 'en', 'es')
  // i18n.language might include region (e.g. 'en-US'), so we might split it or just use it as is if we standardized.
  // For display, we want 'EN' or 'ES'.
  const currentLang = i18n.language ? i18n.language.split('-')[0].toUpperCase() : 'EN';

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'secondary.main',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}
        >
          {currentLang}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="language-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => changeLanguage('en')}>
          English
        </MenuItem>
        <MenuItem onClick={() => changeLanguage('es')}>
          Español
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
