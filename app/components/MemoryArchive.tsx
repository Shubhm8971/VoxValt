'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Calendar, Tag, Archive, Clock, TrendingUp, Bookmark, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Memory {
  id: string;
  content: string;
  type: string;
  team_id?: string;
  importance_score: number;
  similarity?: number;
  search_rank?: number;
  created_at: string;
  access_count: number;
  last_accessed: string;
}

interface SearchFilters {
  searchType: 'semantic' | 'text' | 'hybrid';
  contentTypes: string[];
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  similarityThreshold: number;
  teamId: string | null;
}

interface MemoryArchiveProps {
  teamId?: string;
  className?: string;
}

export function MemoryArchive({ teamId, className = '' }: MemoryArchiveProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    searchType: 'semantic',
    contentTypes: [],
    dateRange: { startDate: null, endDate: null },
    similarityThreshold: 0.7,
    teamId: teamId || null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [trending, setTrending] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSearchSuggestions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setMemories([]);
      setSearchStats(null);
    }
  }, [searchQuery, filters]);

  const loadSearchSuggestions = async () => {
    try {
      const [trendingRes, recentRes, suggestedRes] = await Promise.all([
        fetch('/api/search/advanced?type=trending'),
        fetch('/api/search/advanced?type=recent'),
        fetch('/api/search/advanced?type=suggested')
      ]);

      const trendingData = await trendingRes.json();
      const recentData = await recentRes.json();
      const suggestedData = await suggestedRes.json();

      setTrending(trendingData.trending?.map((t: any) => t.search_query) || []);
      setRecentSearches(recentData.recent?.map((r: any) => r.search_query) || []);
      setSuggestions(suggestedData.suggestions || []);
    } catch (error) {
      console.error('Failed to load search suggestions:', error);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          searchType: filters.searchType,
          teamId: filters.teamId,
          filters: {
            contentTypes: filters.contentTypes,
            dateRange: filters.dateRange,
            similarityThreshold: filters.similarityThreshold
          },
          limit: 50
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMemories(data.results);
        setSearchStats({
          totalCount: data.totalCount,
          searchType: data.searchType,
          searchDuration: data.searchDuration
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        performSearch();
      }
    }, 300);
  };

  const getMemoryTypeColor = (type: string) => {
    const colors = {
      task: 'bg-blue-100 text-blue-800',
      promise: 'bg-purple-100 text-purple-800',
      reminder: 'bg-yellow-100 text-yellow-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-vox-surface border border-vox-border rounded-xl ${className}`}>
      {/* Search Header */}
      <div className="p-6 border-b border-vox-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-vox-text flex items-center gap-2">
            <Archive className="w-6 h-6 text-brand-500" />
            Memory Archive
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-vox-surface/80 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 text-vox-text-secondary" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-vox-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search your memory archive..."
            className="w-full pl-10 pr-4 py-3 bg-vox-bg border border-vox-border rounded-xl text-vox-text placeholder:text-vox-text-muted focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
          
          {/* Search Suggestions Dropdown */}
          {searchQuery && suggestions.length > 0 && !memories.length && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-card rounded-xl shadow-elevated border border-vox-border max-h-60 overflow-y-auto">
              <div className="p-2">
                <p className="text-xs text-vox-text-muted mb-2 px-2">Suggested memories</p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(suggestion.query)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-vox-surface transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-vox-text">{suggestion.query}</span>
                      <span className={`text-xs ${getScoreColor(suggestion.score)}`}>
                        {Math.round(suggestion.score * 100)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Stats */}
        {searchStats && (
          <div className="mt-3 flex items-center gap-4 text-xs text-vox-text-muted">
            <span>{searchStats.totalCount} results</span>
            <span>•</span>
            <span>{searchStats.searchType} search</span>
            <span>•</span>
            <span>{searchStats.searchDuration}ms</span>
          </div>
        )}

        {/* Quick Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {trending.slice(0, 3).map((term, index) => (
            <button
              key={index}
              onClick={() => setSearchQuery(term)}
              className="flex items-center gap-1 px-3 py-1 bg-brand-500/10 text-brand-500 rounded-full text-xs hover:bg-brand-500/20 transition-colors"
            >
              <TrendingUp className="w-3 h-3" />
              {term}
            </button>
          ))}
          {recentSearches.slice(0, 2).map((term, index) => (
            <button
              key={index}
              onClick={() => setSearchQuery(term)}
              className="flex items-center gap-1 px-3 py-1 bg-vox-surface text-vox-text-secondary rounded-full text-xs hover:bg-vox-surface/80 transition-colors"
            >
              <Clock className="w-3 h-3" />
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="p-6 border-b border-vox-border bg-vox-bg/30">
          <h3 className="text-sm font-semibold text-vox-text mb-4">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Type */}
            <div>
              <label className="block text-xs font-medium text-vox-text mb-2">Search Type</label>
              <select
                value={filters.searchType}
                onChange={(e) => setFilters({ ...filters, searchType: e.target.value as any })}
                className="w-full px-3 py-2 bg-vox-surface border border-vox-border rounded-lg text-sm text-vox-text"
              >
                <option value="semantic">Semantic (AI)</option>
                <option value="text">Text Search</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Content Types */}
            <div>
              <label className="block text-xs font-medium text-vox-text mb-2">Content Types</label>
              <div className="space-y-2">
                {['task', 'promise', 'reminder', 'general'].map(type => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.contentTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ ...filters, contentTypes: [...filters.contentTypes, type] });
                        } else {
                          setFilters({ ...filters, contentTypes: filters.contentTypes.filter(t => t !== type) });
                        }
                      }}
                      className="rounded border-vox-border bg-vox-bg text-brand-500"
                    />
                    <span className="text-vox-text capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Similarity Threshold */}
            {filters.searchType !== 'text' && (
              <div>
                <label className="block text-xs font-medium text-vox-text mb-2">
                  Similarity Threshold: {Math.round(filters.similarityThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={filters.similarityThreshold}
                  onChange={(e) => setFilters({ ...filters, similarityThreshold: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-vox-text mb-2">Start Date</label>
              <input
                type="date"
                value={filters.dateRange.startDate || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  dateRange: { ...filters.dateRange, startDate: e.target.value || null }
                })}
                className="w-full px-3 py-2 bg-vox-surface border border-vox-border rounded-lg text-sm text-vox-text"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-vox-text mb-2">End Date</label>
              <input
                type="date"
                value={filters.dateRange.endDate || ''}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  dateRange: { ...filters.dateRange, endDate: e.target.value || null }
                })}
                className="w-full px-3 py-2 bg-vox-surface border border-vox-border rounded-lg text-sm text-vox-text"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-vox-text-muted">Searching memories...</p>
          </div>
        ) : memories.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <Archive className="w-12 h-12 text-vox-text-muted mx-auto mb-4" />
            <p className="text-sm text-vox-text-muted">No memories found</p>
            <p className="text-xs text-vox-text-muted mt-2">Try adjusting your search or filters</p>
          </div>
        ) : memories.length === 0 && !searchQuery ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-vox-text-muted mx-auto mb-4" />
            <p className="text-sm text-vox-text-muted">Search your memory archive</p>
            <p className="text-xs text-vox-text-muted mt-2">Find tasks, promises, and reminders from your past</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((memory) => (
              <div
                key={memory.id}
                onClick={() => setSelectedMemory(memory)}
                className="p-4 bg-vox-bg rounded-xl border border-vox-border hover:border-brand-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getMemoryTypeColor(memory.type)}`}>
                        {memory.type}
                      </span>
                      {memory.similarity && (
                        <span className={`text-xs ${getScoreColor(memory.similarity)}`}>
                          {Math.round(memory.similarity * 100)}% match
                        </span>
                      )}
                      {memory.importance_score > 0.7 && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Important
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-vox-text line-clamp-3 mb-2">
                      {memory.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-vox-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                      </span>
                      <span>Accessed {memory.access_count} times</span>
                      {memory.team_id && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Team
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMemory(null)} />
          <div className="relative bg-vox-surface rounded-2xl border border-vox-border max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <button
              onClick={() => setSelectedMemory(null)}
              className="absolute top-4 right-4 p-2 hover:bg-vox-surface/80 rounded-lg"
            >
              <X className="w-4 h-4 text-vox-text-secondary" />
            </button>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getMemoryTypeColor(selectedMemory.type)}`}>
                  {selectedMemory.type}
                </span>
                {selectedMemory.importance_score > 0.7 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Important
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-vox-text mb-4">
                Memory Details
              </h3>
              
              <div className="bg-vox-bg rounded-lg p-4 mb-4">
                <p className="text-sm text-vox-text leading-relaxed">
                  {selectedMemory.content}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-vox-text-muted">
                <div>
                  <span className="block font-medium mb-1">Created</span>
                  {new Date(selectedMemory.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="block font-medium mb-1">Last Accessed</span>
                  {new Date(selectedMemory.last_accessed).toLocaleString()}
                </div>
                <div>
                  <span className="block font-medium mb-1">Access Count</span>
                  {selectedMemory.access_count}
                </div>
                <div>
                  <span className="block font-medium mb-1">Importance Score</span>
                  <span className={getScoreColor(selectedMemory.importance_score)}>
                    {Math.round(selectedMemory.importance_score * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
