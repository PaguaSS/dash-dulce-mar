import api from './api';

export interface CalculatorParams {
    gasPricePerLt: number;
    averageKmPerLitre: number;
    bakerPayPerHour: number;
    driverPayPerHour: number;
    waterPricePerLitre: number;
    bakePricePerMin: number;
    crFee: number;
}

export const calculatorParamsService = {
    get: async () => {
        const response = await api.get<CalculatorParams>('/app-config/calculator-params');
        return response.data;
    },

    update: async (data: Partial<CalculatorParams>) => {
        const response = await api.patch<CalculatorParams>('/app-config/calculator-params', data);
        return response.data;
    }
};
