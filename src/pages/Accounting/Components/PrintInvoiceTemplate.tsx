import React from 'react';
import { Box, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { appConfigService, type InvoiceParams } from '../../../services/app-config.service';
import type { Client } from '../../../services/client.service';
import { PaymentMethod } from '../../../services/invoice.service';

interface FormItem {
  tempId: string;
  name: string;
  quantity: number;
  metric: string | null;
  unitPrice: number;
  subtotal: number;
  isIncluded: boolean;
}

interface PrintInvoiceTemplateProps {
  description: string;
  client: Client | null;
  items: FormItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  profit: number;
  profitMargin: number;
  total: number;
  paymentMethod: PaymentMethod;
  invoiceNumber?: string;
  date?: string;
}

const PrintInvoiceTemplate: React.FC<PrintInvoiceTemplateProps> = ({
  description,
  client,
  items,
  subtotal,
  tax,
  taxRate,
  profit,
  profitMargin,
  total,
  paymentMethod,
  invoiceNumber = '---',
  date = new Date().toLocaleDateString(),
}) => {
  const { t } = useTranslation();
  const [params, setParams] = React.useState<InvoiceParams | null>(null);

  React.useEffect(() => {
    appConfigService.getInvoiceParams().then(setParams).catch(console.error);
  }, []);

  const businessName = params?.businessName || 'Dulce Mar';
  const location = params?.location || '';
  const phone = params?.phone || '';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box
      className="print-only"
      sx={{
        display: 'none',
        '@media print': {
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: 'white',
          padding: '2cm',
          color: 'black',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/logo-small.png"
            sx={{ width: 80, height: 80, objectFit: 'contain' }}
          />
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>
              {businessName}
            </Typography>
            <Typography variant="body2">{location}</Typography>
            <Typography variant="body2">Tel: {phone}</Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" fontWeight="bold">
            {t('accounting.table.serialNumber')}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {invoiceNumber}
          </Typography>
          <Typography variant="body2">{date}</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Client & Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {t('accounting.form.client')}
          </Typography>
          {client ? (
            <>
              <Typography variant="body1">{`${client.name} ${client.lastname || ''}`}</Typography>
              <Typography variant="body2">{client.phone}</Typography>
              <Typography variant="body2">{client.email}</Typography>
            </>
          ) : (
            <Typography variant="body1">---</Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {t('accounting.form.details')}
          </Typography>
          <Typography variant="body1">{description}</Typography>
          <Typography variant="body2">
            {t('accounting.form.paymentMethod')}: {t(`accounting.paymentMethods.${paymentMethod}`)}
          </Typography>
        </Box>
      </Box>

      {/* Items Table */}
      <TableContainer sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('accounting.table.name')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: 100 }}>{t('accounting.table.qty')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: 120 }}>{t('accounting.table.unitPrice')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: 120 }}>{t('accounting.table.subtotal')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">{item.quantity} {item.metric || ''}</TableCell>
                <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ width: 250 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">{t('accounting.totals.subtotal')}</Typography>
            <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">{t('accounting.totals.tax')} ({taxRate}%)</Typography>
            <Typography variant="body2">{formatCurrency(tax)}</Typography>
          </Box>
          {profitMargin > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">{t('accounting.totals.profit')} ({profitMargin}%)</Typography>
              <Typography variant="body2" color="success.main">{formatCurrency(profit)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">{t('accounting.totals.total')}</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">{formatCurrency(total)}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 10, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('accounting.form.thanks')}
        </Typography>
      </Box>
    </Box>
  );
};

export default PrintInvoiceTemplate;
