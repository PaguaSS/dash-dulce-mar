import api from './api';

export interface AppConfig {
    currencySign: string;
}

export interface InvoiceParams {
    businessName: string;
    location: string;
    phone: string;
}

export const appConfigService = {
    getConfig: async () => {
        const response = await api.get<AppConfig>('/app-config');
        return response.data;
    },
    getInvoiceParams: async () => {
        const response = await api.get<InvoiceParams>('/app-config/invoice-params');
        return response.data;
    },
    updateInvoiceParams: async (params: Partial<InvoiceParams>) => {
        const response = await api.patch<InvoiceParams>('/app-config/invoice-params', params);
        return response.data;
    }
};
