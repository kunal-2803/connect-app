import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfiles, setFilters, setPage, clearDiscoverError } from '../../features/discover/discoverSlice';
import { searchProfiles, setSearchTerm } from '../../features/profile/profileSlice';
import ProfileCard from '../../components/ProfileCard/ProfileCard';
import PaginationControls from '../../components/PaginationControls/PaginationControls';
import './DiscoverPage.css';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import debounce from 'lodash/debounce';

const DiscoverPage = () => {
  const dispatch = useDispatch();
  const { profiles, pagination, filters, isLoading, error } = useSelector((state) => state.discover);
  
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm || '');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    interests: filters.interests || '',
    minAge: filters.minAge || '',
    maxAge: filters.maxAge || '',
  });
  const [page, setPage] = useState(1);

  // Update the debounced search to use searchProfiles
  const debouncedSetSearchTerm = useCallback(
    debounce((term) => {
      if (term) {
        dispatch(searchProfiles(term));
      } else {
        dispatch(fetchProfiles({ 
          page: 1,
          interests: filters.interests,
          minAge: filters.minAge,
          maxAge: filters.maxAge
        }));
      }
    }, 500),
    [dispatch, filters]
  );

  useEffect(() => {
    // Clear errors on mount
    dispatch(clearDiscoverError());
    
    // Initial fetch or filter changes
    if (!localSearchTerm) {
      dispatch(fetchProfiles({ 
        page: pagination.currentPage, 
        interests: filters.interests,
        minAge: filters.minAge,
        maxAge: filters.maxAge
      }));
    }
  }, [dispatch, pagination.currentPage, filters, localSearchTerm]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    debouncedSetSearchTerm(value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      // Only fetch with pagination if not in search mode
      if (!localSearchTerm) {
        dispatch(setPage(newPage));
        dispatch(fetchProfiles({ 
          page: newPage,
          interests: filters.interests,
          minAge: filters.minAge,
          maxAge: filters.maxAge
        }));
      }
    }
  };

  const handleFilterInputChange = (e) => {
    setLocalFilters({ ...localFilters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    dispatch(setFilters(localFilters));
    setShowFilterModal(false);
    // fetchProfiles will be triggered by useEffect due to filters change
  };
  
  const clearAllFilters = () => {
    setLocalFilters({ interests: '', minAge: '', maxAge: '' });
    setLocalSearchTerm('');
    dispatch(setFilters({ interests: '', minAge: '', maxAge: '', searchTerm: '' }));
    setShowFilterModal(false);
  }

  const activeFilterCount = Object.values(filters).filter(val => val && val !== '').length;

  const handleLoadMore = () => {
    if (pagination.hasNextPage && !localSearchTerm) {
      const nextPage = page + 1;
      setPage(nextPage);
      dispatch(fetchProfiles({ 
        page: nextPage,
        interests: filters.interests,
        minAge: filters.minAge,
        maxAge: filters.maxAge
      }));
    }
  };

  return (
    <div className="discover-page">
      <div className="discover-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by username..." 
            value={localSearchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <button className="filter-button" onClick={() => setShowFilterModal(true)}>
          <FaFilter /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      {showFilterModal && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <h3>Filter Profiles</h3>
            <button className="close-modal-button" onClick={() => setShowFilterModal(false)}><FaTimes /></button>
            <div className="form-group">
              <label htmlFor="interests">Interests (comma-separated)</label>
              <input type="text" name="interests" value={localFilters.interests} onChange={handleFilterInputChange} placeholder="e.g., travel, art" />
            </div>
            <div className="form-group">
              <label htmlFor="minAge">Min Age</label>
              <input type="number" name="minAge" value={localFilters.minAge} onChange={handleFilterInputChange} placeholder="e.g., 25" min="18"/>
            </div>
            <div className="form-group">
              <label htmlFor="maxAge">Max Age</label>
              <input type="number" name="maxAge" value={localFilters.maxAge} onChange={handleFilterInputChange} placeholder="e.g., 40" min="18"/>
            </div>
            <div className="filter-modal-actions">
              <button onClick={applyFilters} className="apply-filters-button">Apply Filters</button>
              <button onClick={clearAllFilters} className="clear-filters-button">Clear All Filters</button>
            </div>
          </div>
        </div>
      )}
      
      {isLoading && <div className="loading-indicator">Loading profiles...</div>}
      {error && <div className="error-message">Error: {error.msg || 'Could not load profiles.'}</div>}
      
      {!isLoading && !error && profiles.length === 0 && (
        <div className="no-profiles-message">No profiles found matching your criteria. Try adjusting your filters!</div>
      )}

      {!isLoading && profiles.length > 0 && (
        <>
          <div className="profiles-grid">
            {profiles.map(profile => (
              <ProfileCard key={profile._id} profile={profile} />
            ))}
          </div>
          <PaginationControls 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
          {pagination.hasNextPage && (
            <button 
              onClick={handleLoadMore}
              className="load-more-button"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DiscoverPage;