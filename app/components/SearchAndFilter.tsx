'use client';

import { useState } from 'react';
import { useWindowSize, breakpoints } from '@/lib/use-responsive';
import { SearchFilters, TaskStatus, TaskTypeFilter } from '@/lib/search-utils';

interface SearchAndFilterProps {
  onFilterChange: (filters: SearchFilters) => void;
  showDateRange?: boolean;
}

export function SearchAndFilter({ onFilterChange, showDateRange = true }: SearchAndFilterProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: '',
    taskStatus: 'all',
    taskType: 'all',
    sortBy: 'recent',
    dateRange: {
      startDate: null,
      endDate: null,
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < breakpoints.tablet;

  const handleSearchChange = (text: string) => {
    const newFilters = { ...filters, searchText: text };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (status: TaskStatus) => {
    const newFilters = { ...filters, taskStatus: status };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTypeChange = (type: TaskTypeFilter) => {
    const newFilters = { ...filters, taskType: type };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleSmartSort = () => {
    const newSort = filters.sortBy === 'smart' ? 'recent' : 'smart';
    const newFilters = { ...filters, sortBy: newSort as any };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = {
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value || null,
      },
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const newFilters: SearchFilters = {
      searchText: '',
      taskStatus: 'all',
      taskType: 'all',
      sortBy: 'recent',
      dateRange: { startDate: null, endDate: null },
    };
    setFilters(newFilters);
    setShowAdvanced(false);
    onFilterChange(newFilters);
  };

  const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      borderRadius: '0.75rem',
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: '1.5rem',
    },
    searchBox: {
      display: 'flex',
      gap: isMobile ? '0.5rem' : '1rem',
      marginBottom: '1rem',
      flexWrap: 'wrap' as const,
    },
    input: {
      flex: 1,
      minWidth: isMobile ? '100%' : '200px',
      padding: '0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      boxSizing: 'border-box' as const,
      transition: 'all 0.2s ease',
    },
    buttonSmall: {
      padding: '0.75rem 1rem',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      minHeight: '44px',
      transition: 'all 0.2s ease',
    },
    filterGroup: {
      display: 'flex',
      gap: isMobile ? '0.5rem' : '1rem',
      marginBottom: '1rem',
      flexWrap: 'wrap' as const,
    },
    filterLabel: {
      fontSize: '0.85rem',
      fontWeight: '600',
      color: '#555',
      marginBottom: '0.5rem',
      display: 'block',
    },
    select: {
      padding: '0.5rem 0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '0.5rem',
      fontSize: '0.9rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box' as const,
    },
    filterButton: {
      padding: '0.5rem 1rem',
      border: '2px solid #e0e0e0',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.85rem',
      backgroundColor: 'white',
      transition: 'all 0.2s ease',
      minHeight: '44px',
    },
    activeFilter: {
      borderColor: '#667eea',
      backgroundColor: '#667eea',
      color: 'white',
    },
  };

  return (
    <div style={styles.container}>
      {/* Main Search */}
      <div style={styles.searchBox}>
        <input
          type="text"
          placeholder="🔍 Search tasks, recordings..."
          value={filters.searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            ...styles.buttonSmall,
            backgroundColor: showAdvanced ? '#667eea' : '#e0e0e0',
            color: showAdvanced ? 'white' : '#333',
          }}
        >
          ⚙️ {!isMobile && 'Advanced'}
        </button>
        {(filters.taskStatus !== 'all' ||
          filters.taskType !== 'all' ||
          filters.dateRange.startDate ||
          filters.dateRange.endDate) && (
            <button
              onClick={resetFilters}
              style={{
                ...styles.buttonSmall,
                backgroundColor: '#ef4444',
                color: 'white',
              }}
            >
              ✕ Clear
            </button>
          )}
      </div>

      {/* Quick Filters */}
      <div style={styles.filterGroup}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={styles.filterLabel}>Status:</label>
          <select
            value={filters.taskStatus}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            style={styles.select}
          >
            <option value="all">All Tasks</option>
            <option value="active">Active Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={styles.filterLabel}>Type:</label>
          <select
            value={filters.taskType}
            onChange={(e) => handleTypeChange(e.target.value as TaskTypeFilter)}
            style={styles.select}
          >
            <option value="all">All Types</option>
            <option value="task">Tasks</option>
            <option value="reminder">Reminders</option>
            <option value="promise">Promises</option>
            <option value="recurring">Recurring</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={toggleSmartSort}
            style={{
              ...styles.filterButton,
              ...(filters.sortBy === 'smart' ? styles.activeFilter : {}),
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: filters.sortBy === 'smart' ? 'none' : '2px solid #e0e0e0',
              backgroundColor: filters.sortBy === 'smart' ? '#f59e0b' : 'white', // amber-500 for "Hot" sort
            }}
          >
            {filters.sortBy === 'smart' ? '🔥 Smart Sort On' : '✨ Enable Smart Sort'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && showDateRange && (
        <div style={styles.filterGroup}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={styles.filterLabel}>From Date:</label>
            <input
              type="date"
              value={filters.dateRange.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              style={styles.select}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={styles.filterLabel}>To Date:</label>
            <input
              type="date"
              value={filters.dateRange.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              style={styles.select}
            />
          </div>
        </div>
      )}
    </div>
  );
}
