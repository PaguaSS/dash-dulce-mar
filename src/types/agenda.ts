export interface AgendaItem {
  id: string;
  agendaId: string;
  filename: string;
  createdAt: string;
}

export interface Agenda {
  id: string;
  description: string;
  bookDate: string;
  createdAt: string;
  updatedAt: string;
  items: AgendaItem[];
}

export interface CreateAgendaDto {
  description: string;
  bookDate: string; // ISO Date string
}

export interface UpdateAgendaDto {
  description?: string;
  bookDate?: string;
}

export interface AgendaFilters {
  description?: string;
  year?: number;
  month?: number;
  day?: number;
  date?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
}

export interface AgendaResponse {
  data: Agenda[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
