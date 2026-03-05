import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

import { useTranslation } from 'react-i18next';

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isDestructive = false,
}) => {
  const { t } = useTranslation();
  const effectiveConfirmText = confirmText || t('common.confirm');
  const effectiveCancelText = cancelText || t('common.cancel');

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{
        sx: { borderRadius: 3, p: 1 }
      }}
    >
      <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 600 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {effectiveCancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={isDestructive ? "error" : "primary"}
          variant="contained"
          autoFocus
        >
          {effectiveConfirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
