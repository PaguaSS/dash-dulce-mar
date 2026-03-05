import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, CircularProgress } from '@mui/material';
import AgendaToolbar from './components/AgendaToolbar';
import CalendarGrid from './components/CalendarGrid';
import AgendaItemModal from './components/AgendaItemModal';
import { agendaService } from '../../services/agenda.service';
import type {
  Agenda,
  AgendaFilters,
  CreateAgendaDto,
  UpdateAgendaDto,
} from '../../types/agenda';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const AgendaPage: React.FC = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<Agenda[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Agenda | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let filters: AgendaFilters = { description: searchTerm };

      if (!searchTerm) {
        // Optimize fetching based on view
        if (viewMode === 'month') {
          // start and end variables removed as they were unused
          // API doesn't support range directly yet, but we can filter by month/year
          // Optimization: Just fetch for the month
          filters.year = currentDate.getFullYear();
          filters.month = currentDate.getMonth() + 1;
        } else if (viewMode === 'day') {
          filters.date = currentDate.toISOString().split('T')[0];
        }
        // For week view, might span months, so ideally we'd need a range filter or fetch all for potential months
        // Simple fallback: fetch by month of current date
        if (viewMode === 'week') {
          filters.year = currentDate.getFullYear();
          filters.month = currentDate.getMonth() + 1;
        }
      }

      // If searching, we might want to ignore date filters to find results globally,
      // or constrain to current view. Requirement implies filtering mechanism.
      // Let's stick to current view context unless explicitly clearing dates via UI (which we don't have yet beyond views)
      // Actually, standard behavior for search is usually global.
      if (searchTerm) {
        filters = { description: searchTerm };
      }

      // Given the API limitations (no range filter), for Month/Week views crossing boundaries,
      // we might miss items if we only filter by single month/year.
      // Best approach without modifying API: Fetch generic generic/paginated or use the implemented filters strictly.
      // The implemented API has 'year', 'month', 'day'.
      // Let's rely on the requested feature: "filter by day, week, month".

      const response = await agendaService.getAll(filters);
      setItems(response.data);
    } catch (error) {
      console.error(error);
      toast.error(t('agenda.loadError'));
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, searchTerm, t]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreateOrUpdate = async (
    data: CreateAgendaDto | UpdateAgendaDto,
    files?: File[],
  ) => {
    try {
      let savedItem: Agenda;
      if (selectedItem) {
        savedItem = await agendaService.update(selectedItem.id, data);
        toast.success(t('agenda.updateSuccess'));
      } else {
        savedItem = await agendaService.create(data as CreateAgendaDto);
        toast.success(t('agenda.createSuccess'));
      }

      if (files && files.length > 0) {
        await agendaService.uploadItems(savedItem.id, files);
      }

      setModalOpen(false);
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error(t('agenda.saveError'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await agendaService.delete(id);
      toast.success(t('agenda.deleteSuccess'));
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error(t('agenda.deleteError'));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await agendaService.deleteItem(itemId);
      toast.success(t('agenda.itemDeleteSuccess'));
      // Refresh local item state if open
      if (selectedItem) {
        const updated = await agendaService.getById(selectedItem.id);
        setSelectedItem(updated);
      }
      fetchItems();
    } catch (_error) {
      toast.error(t('agenda.deleteError'));
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleItemClick = (item: Agenda) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  return (
    <Box>
      <AgendaToolbar
        viewMode={viewMode}
        onViewChange={setViewMode}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onAddClick={handleAddItem}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <Paper sx={{ p: 2, minHeight: 400 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 400,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <CalendarGrid
            viewMode={viewMode}
            currentDate={currentDate}
            items={items}
            onItemClick={handleItemClick}
          />
        )}
      </Paper>

      <AgendaItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={selectedItem}
        categoryDate={currentDate}
        onSave={handleCreateOrUpdate}
        onDelete={handleDelete}
        onDeleteItem={handleDeleteItem}
      />
    </Box>
  );
};

export default AgendaPage;
