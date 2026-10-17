import { useState, useMemo } from 'react';
import { Problem } from '@/data/mockData';

export type StatusFilterOption = 'all' | Problem['status'];
export type CategoryFilterOption = 'all' | Problem['category'];

export interface UseOccurrenceFiltersOptions {
  initialStatus?: StatusFilterOption;
  initialCategory?: CategoryFilterOption;
}

export function useOccurrenceFilters(
  problems: Problem[],
  options?: UseOccurrenceFiltersOptions
) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>(
    options?.initialStatus || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterOption>(
    options?.initialCategory || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Filtro de status
      if (statusFilter !== 'all' && problem.status !== statusFilter) {
        return false;
      }

      // Filtro de categoria
      if (categoryFilter !== 'all' && problem.category !== categoryFilter) {
        return false;
      }

      // Filtro de busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = problem.title.toLowerCase().includes(query);
        const matchesDesc = problem.description.toLowerCase().includes(query);
        const matchesAddress = problem.location?.address?.toLowerCase().includes(query) ?? false;

        if (!matchesTitle && !matchesDesc && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [problems, statusFilter, categoryFilter, searchQuery]);

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  return {
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    filteredProblems,
    clearFilters,
    totalCount: problems.length,
    filteredCount: filteredProblems.length,
  };
}
