import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { Pencil, Trash2, X, FileText, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Agenda, CreateAgendaDto, UpdateAgendaDto } from '../../../types/agenda';
import { format } from 'date-fns';
import ConfirmationModal from '../../../components/ConfirmationModal';
import imageCompression from 'browser-image-compression';

interface AgendaItemModalProps {
  open: boolean;
  onClose: () => void;
  item: Agenda | null; // If null, we are adding a new item
  categoryDate?: Date; // For pre-filling date when adding new
  onSave: (data: CreateAgendaDto | UpdateAgendaDto, files?: File[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
}

const schema = z.object({
  description: z.string().min(1, 'Description is required'),
  bookDate: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
});

type FormData = z.infer<typeof schema>;

const AgendaItemModal: React.FC<AgendaItemModalProps> = ({
  open,
  onClose,
  item,
  categoryDate,
  onSave,
  onDelete,
  onDeleteItem
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsEditing(false); // Default to view mode if item exists
        const date = new Date(item.bookDate);
        setValue('description', item.description);
        setValue('bookDate', format(date, 'yyyy-MM-dd'));
        setValue('time', format(date, 'HH:mm'));
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsEditing(true); // Default to edit mode for new items
        reset({
          description: '',
          bookDate: categoryDate ? format(categoryDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          time: format(new Date(), 'HH:mm'),
        });
      }
      setSelectedFiles([]);
    }
  }, [open, item, categoryDate, setValue, reset]);

  const onSubmit = async (data: FormData) => {
    const dateTime = new Date(`${data.bookDate}T${data.time}`);
    await onSave({
      description: data.description,
      bookDate: dateTime.toISOString(),
    }, selectedFiles.length > 0 ? selectedFiles : undefined);
    // onClose handled by parent on success
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (item) {
      await onDelete(item.id);
      setIsDeleteModalOpen(false);
      onClose();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setIsCompressing(true);
      const files = Array.from(event.target.files);
      const processedFiles: File[] = [];

      for (const file of files) {
        // Check if image
        if (file.type.startsWith('image/')) {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);
            // Create a new File object to preserve original name if needed, or stick with Blob from compression
            // browser-image-compression returns a Blob/File. Let's cast/wrap it to be safe for existing APIs expectation
            processedFiles.push(new File([compressedFile], file.name, { type: file.type }));
          } catch (error) {
            console.error('Compression failed for', file.name, error);
            processedFiles.push(file); // Fallback to original
          }
        } else {
          processedFiles.push(file);
        }
      }
      setSelectedFiles((prev) => [...prev, ...processedFiles]);
      setIsCompressing(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  const getAssetUrl = (filename: string) => {
    const assetsUrl = import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/assets';
    return `${assetsUrl}/agenda/${filename}`;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {item && !isEditing ? t('agenda.details') : (item ? t('agenda.edit') : t('agenda.add'))}
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            {!isEditing && item ? (
              <Box>
                <Typography variant="h6" gutterBottom>{item.description}</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {format(new Date(item.bookDate), 'Pp')}
                </Typography>
                
                {item.items && item.items.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>{t('agenda.attachments')}:</Typography>
                    <List dense>
                      {item.items.map((file) => (
                        <ListItem 
                            key={file.id}
                            secondaryAction={
                                <IconButton edge="end" aria-label="delete" onClick={() => onDeleteItem(file.id)}>
                                    <Trash2 size={16} />
                                </IconButton>
                            }
                        >
                          <ListItemIcon>
                            {isImage(file.filename) ? (
                                <Box 
                                    component="img" 
                                    src={getAssetUrl(file.filename)}
                                    alt={file.filename}
                                    sx={{ 
                                        width: 40, 
                                        height: 40, 
                                        objectFit: 'cover', 
                                        borderRadius: 1,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setPreviewImage(getAssetUrl(file.filename))}
                                />
                            ) : (
                                <FileText size={20} />
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                                isImage(file.filename) ? (
                                    <Typography 
                                        variant="body2" 
                                        component="span" 
                                        sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                                        onClick={() => setPreviewImage(getAssetUrl(file.filename))}
                                    >
                                        {file.filename}
                                    </Typography>
                                ) : file.filename
                            } 
                            secondary={format(new Date(file.createdAt), 'P')} 
                            />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('agenda.description')}
                  fullWidth
                  {...register('description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Controller
                    name="bookDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label={t('common.date')}
                        value={field.value ? new Date(field.value + 'T00:00:00') : null}
                        onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.bookDate,
                            helperText: errors.bookDate?.message
                          }
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="time"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        label={t('common.time')}
                        value={field.value ? new Date(`1970-01-01T${field.value}`) : null}
                        onChange={(date) => field.onChange(date ? format(date, 'HH:mm') : '')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.time,
                            helperText: errors.time?.message
                          }
                        }}
                        ampm={false}
                      />
                    )}
                  />
                </Box>
                
                <Box>
                  <input
                    accept="*/*"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    multiple
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="raised-button-file">
                    <Button 
                        variant="outlined" 
                        component="span" 
                        startIcon={isCompressing ? <CircularProgress size={18} /> : <Upload size={18} />}
                        disabled={isCompressing}
                    >
                      {t('agenda.uploadFile')}
                    </Button>
                  </label>
                  
                  {selectedFiles.length > 0 && (
                    <List dense sx={{ mt: 1 }}>
                       {selectedFiles.map((file, index) => (
                         <ListItem 
                            key={index}
                            secondaryAction={
                                <IconButton edge="end" size="small" onClick={() => removeFile(index)}>
                                    <X size={16} />
                                </IconButton>
                            }
                         >
                            <ListItemIcon sx={{ minWidth: 30 }}><FileText size={16} /></ListItemIcon>
                            <ListItemText primary={file.name} secondary={(file.size / 1024).toFixed(0) + ' KB'} />
                         </ListItem>
                       ))}
                    </List>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: !isEditing && item ? 'space-between' : 'flex-end', px: 3, py: 2 }}>
            {!isEditing && item ? (
              <>
                 <Box>
                    <IconButton onClick={handleEditClick} color="primary" sx={{ mr: 1 }}>
                        <Pencil size={20} />
                    </IconButton>
                    <IconButton onClick={handleDeleteClick} color="error">
                        <Trash2 size={20} />
                    </IconButton>
                 </Box>
                 <Button onClick={onClose}>{t('common.close')}</Button>
              </>
            ) : (
              <>
                <Button onClick={onClose} color="inherit">{t('common.cancel')}</Button>
                <Button type="submit" variant="contained" disabled={isCompressing || isSubmitting} autoFocus>
                   {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('common.save')}
                </Button>
              </>
            )}
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={t('agenda.confirmDelete')}
        message={t('agenda.deleteMessage')}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive
        confirmText={t('common.delete')}
      />

       {/* Image Preview Modal */}
       <Dialog 
        open={!!previewImage} 
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
      >
         <Box sx={{ position: 'relative', bgcolor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <IconButton 
                onClick={() => setPreviewImage(null)}
                sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
            >
                <X />
            </IconButton>
            <Box 
                component="img" 
                src={previewImage || ''} 
                alt="Preview" 
                sx={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} 
            />
         </Box>
      </Dialog>
    </>
  );
};

export default AgendaItemModal;
