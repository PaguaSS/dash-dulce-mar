import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Merge, Unlink, Printer, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QuotationItemType } from '../../../services/quotation.service';

interface FormItem {
  tempId: string;
  type: QuotationItemType;
  itemReferenceId: string | null;
  name: string;
  quantity: number;
  metric: string | null;
  unitPrice: number;
  subtotal: number;
  isIncluded: boolean;
  metadata: any | null;
}

interface PrintConfigDialogProps {
  open: boolean;
  onClose: () => void;
  items: FormItem[];
  onPrint: (printItems: FormItem[]) => void;
}

const PrintConfigDialog: React.FC<PrintConfigDialogProps> = ({ open, onClose, items, onPrint }) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergedItems, setMergedItems] = useState<FormItem[]>([]);
  const [mergedName, setMergedName] = useState('');

  // Items that are not part of any merge
  const activeItems = useMemo(() => {
    // Start with all included items
    let list = items.filter(i => i.isIncluded);
    
    // Filter out items that are already "parent" items of a merge if we ever implement persistence, 
    // but here we just manage the display list.
    return list;
  }, [items]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMerge = () => {
    if (selectedIds.length < 2 || !mergedName.trim()) return;

    const itemsToMerge = activeItems.filter(i => selectedIds.includes(i.tempId));
    const totalSubtotal = itemsToMerge.reduce((sum, item) => sum + item.subtotal, 0);

    const newMergedItem: FormItem = {
      tempId: `merged-${Date.now()}`,
      type: QuotationItemType.CUSTOM,
      itemReferenceId: null,
      name: mergedName,
      quantity: 1,
      metric: t('quotations.metrics.unit'),
      unitPrice: totalSubtotal,
      subtotal: totalSubtotal,
      isIncluded: true,
      metadata: { mergedFrom: itemsToMerge.map(i => i.tempId) },
    };

    setMergedItems([...mergedItems, newMergedItem]);
    setSelectedIds([]);
    setMergedName('');
  };

  const handleUnmerge = (mergedItemId: string) => {
    setMergedItems(prev => prev.filter(i => i.tempId !== mergedItemId));
  };

  const finalPrintList = useMemo(() => {
    // Get IDs of all items that have been merged
    const mergedSourceIds = mergedItems.flatMap(mi => mi.metadata.mergedFrom);
    
    // Original items that WERE NOT merged
    const unmergedItems = activeItems.filter(i => !mergedSourceIds.includes(i.tempId));
    
    return [...unmergedItems, ...mergedItems];
  }, [activeItems, mergedItems]);

  const handlePrintAction = () => {
    onPrint(finalPrintList);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t('accounting.form.printSetup')}
        <IconButton onClick={onClose} size="small"><X size={20} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left panel: Original Items Selective List */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              1. {t('accounting.form.items')}
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {activeItems
                  .filter(i => !mergedItems.flatMap(mi => mi.metadata.mergedFrom).includes(i.tempId))
                  .map((item) => (
                    <ListItem key={item.tempId} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={selectedIds.includes(item.tempId)}
                          onChange={() => toggleSelection(item.tempId)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.quantity} ${item.metric || ''} - ${formatCurrency(item.subtotal)}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
              </List>
            </Paper>

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
              <TextField
                size="small"
                label={t('accounting.form.mergedName')}
                value={mergedName}
                onChange={(e) => setMergedName(e.target.value)}
                placeholder="e.g. Combined Pack"
                disabled={selectedIds.length < 2}
              />
              <Button
                variant="outlined"
                startIcon={<Merge size={18} />}
                onClick={handleMerge}
                disabled={selectedIds.length < 2 || !mergedName.trim()}
                fullWidth
              >
                {t('accounting.form.mergeSelected')} ({selectedIds.length})
              </Button>
            </Box>
          </Box>

          {/* Right panel: Preview of what will be printed */}
          <Box sx={{ flex: 1.2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              2. {t('accounting.form.preview')}
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>{t('accounting.table.name')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{t('accounting.table.total')}</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finalPrintList.map((item) => (
                    <TableRow key={item.tempId}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: item.tempId.startsWith('merged-') ? 'bold' : 'normal' }}>
                          {item.name}
                        </Typography>
                        {item.tempId.startsWith('merged-') && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            ({item.metadata.mergedFrom.length} items merged)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                      <TableCell align="right">
                        {item.tempId.startsWith('merged-') && (
                          <IconButton size="small" color="warning" onClick={() => handleUnmerge(item.tempId)}>
                            <Unlink size={16} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" startIcon={<Printer size={20} />} onClick={handlePrintAction} autoFocus>
          {t('common.confirm')} & {t('common.print')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintConfigDialog;
