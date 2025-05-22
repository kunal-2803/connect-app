import React from 'react';
import './PaginationControls.css';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Don't show pagination if only one page
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Simple page numbers logic (can be made more complex for many pages)
  let pageNumbers = [];
  const maxPagesToShow = 5; // Max page numbers to display directly

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Logic for "..." if many pages
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push('...');
        pageNumbers.push(totalPages);
    }
  }


  return (
    <div className="pagination-controls">
      <button 
        onClick={handlePrevious} 
        disabled={currentPage === 1}
        className="pagination-button"
        aria-label="Previous Page"
      >
        <FaAngleLeft /> Previous
      </button>
      
      <div className="page-numbers">
        {pageNumbers.map((number, index) => 
          typeof number === 'number' ? (
            <button 
              key={index} 
              onClick={() => onPageChange(number)}
              className={`pagination-button page-number ${currentPage === number ? 'active' : ''}`}
              aria-current={currentPage === number ? 'page' : undefined}
            >
              {number}
            </button>
          ) : (
            <span key={index} className="pagination-ellipsis">...</span>
          )
        )}
      </div>

      <button 
        onClick={handleNext} 
        disabled={currentPage === totalPages}
        className="pagination-button"
        aria-label="Next Page"
      >
        Next <FaAngleRight />
      </button>
    </div>
  );
};

export default PaginationControls;