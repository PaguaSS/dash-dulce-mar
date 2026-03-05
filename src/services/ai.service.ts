import api from './api';

export interface ConvertRequest {
    text: string;
    metrics: Array<{ id: string; title: string }>;
}

export interface ConvertResponse {
    metricId: string | null;
    unitPrice: number | null;
}

export const aiService = {
    convert: async (data: ConvertRequest): Promise<ConvertResponse> => {
        const response = await api.post<ConvertResponse>('/ai/convert', data);
        return response.data;
    }
};
