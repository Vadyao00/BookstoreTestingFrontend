import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [region, setRegion] = useState('en_US');
  const [seed, setSeed] = useState('42');
  const [likesAvg, setLikesAvg] = useState(3.5);
  const [reviewsAvg, setReviewsAvg] = useState(2.0);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedBookId, setExpandedBookId] = useState(null);
  
  const containerRef = useRef(null);
  const INITIAL_BOOKS = 20;
  const BOOKS_PER_PAGE = 10;

  const regions = [
    { value: 'en_US', label: 'English (USA)' },
    { value: 'de_DE', label: 'German (Germany)' },
    { value: 'fr_FR', label: 'French (France)' }
  ];

  useEffect(() => {
    setBooks([]);
    setPage(1);
    setHasMore(true);
    fetchBooks(1, INITIAL_BOOKS);
  }, [region, seed, likesAvg, reviewsAvg]);

  useEffect(() => {
    if (page > 1 && hasMore) {
      fetchBooks(page, BOOKS_PER_PAGE);
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current && !loading && hasMore) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        
        const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 5;
        
        if (isNearBottom) {
          setPage(prev => prev + 1);
        }
      }
    };

    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loading, hasMore]);

  const fetchBooks = async (pageNumber, pageSize) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        region: region,
        seed: seed,
        likesAvg: likesAvg,
        reviewsAvg: reviewsAvg,
        page: pageNumber - 1,
        pageSize: pageSize
      });
      
      const response = await fetch(`https://localhost:7240/api/book?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.length === 0) {
        setHasMore(false);
        return;
      }
  
      if (pageNumber === 1) {
        setBooks(data);
      } else {
        setBooks(prev => {
          const existingIds = new Set(prev.map(book => book.id));
          const newBooks = data.filter(book => !existingIds.has(book.id));
          return [...prev, ...newBooks];
        });
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomSeed = async () => {
    try {
      const response = await fetch('https://localhost:7240/api/book/random-seed');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const newSeed = await response.text();
      setSeed(newSeed);
    } catch (error) {
      console.error("Error generating random seed:", error);
      const fallbackSeed = Math.floor(Math.random() * 10000000).toString();
      setSeed(fallbackSeed);
    }
  };

  const toggleExpandBook = (bookId) => {
    if (expandedBookId === bookId) {
      setExpandedBookId(null);
    } else {
      setExpandedBookId(bookId);
    }
  };

  const renderExpandedBook = (book) => {
    return (
      <div className="expanded-book">
        <div className="expanded-book-container">
          <div 
            className="book-cover"
            style={{ backgroundColor: book.coverColor }}
          >
            <div className="book-cover-info">
              <div className="book-title">{book.title}</div>
              <div className="book-author">{book.authors[0]}{book.authors.length > 1 ? ' et al.' : ''}</div>
            </div>
          </div>
          
          <div className="expanded-book-details">
            <h3 className="expanded-book-title">{book.title} {book.publishYear && <span className="book-year">({book.publishYear})</span>}</h3>
            <p className="book-authors">by {book.authors.join(', ')}</p>
            <p className="book-isbn">ISBN: {book.isbn}</p>
            <p className="book-publisher">Publisher: {book.publisher}</p>
            
            <h4 className="reviews-title">Reviews ({book.reviews.length})</h4>
            {book.reviews.length > 0 ? (
              <div className="reviews-list">
                {book.reviews.map((review, idx) => (
                  <div key={idx} className="review">
                    <div className="review-header">
                      <span className="reviewer-name">{review.reviewer}</span>
                      <span className="review-rating">{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span>
                    </div>
                    {review.company && <div className="reviewer-company">{review.company}</div>}
                    <p className="review-text">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-reviews">No reviews yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Bookstore Testing App</h1>
        <p>Generate realistic book data for testing purposes</p>
      </header>
      
      <div className="controls">
        <div className="control-group">
          <label>Language/Region</label>
          <select 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {regions.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Seed Value</label>
          <div className="seed-control">
            <input 
              type="text" 
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
            <button 
              className="random-seed-button"
              onClick={generateRandomSeed}
              title="Generate Random Seed"
            >
              🔀
            </button>
          </div>
        </div>
        
        <div className="control-group">
          <label>Average Likes Per Book: {likesAvg}</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            step="0.1"
            value={likesAvg}
            onChange={(e) => setLikesAvg(parseFloat(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>Average Reviews Per Book</label>
          <input 
            type="number" 
            min="0" 
            max="10" 
            step="0.1"
            value={reviewsAvg}
            onChange={(e) => setReviewsAvg(parseFloat(e.target.value))}
          />
        </div>
      </div>
      
      {loading && books.length === 0 && <div className="loading">Loading books...</div>}
      
      <div 
        ref={containerRef} 
        className="books-container full-height"
      >
        {books.length > 0 ? (
          <table className="books-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ISBN</th>
                <th>Title</th>
                <th>Author(s)</th>
                <th>Publisher</th>
                <th>Likes</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <React.Fragment key={book.id}>
                  <tr 
                    onClick={() => toggleExpandBook(book.id)}
                    className={expandedBookId === book.id ? 'expanded' : ''}
                  >
                    <td>{book.id}</td>
                    <td>{book.isbn}</td>
                    <td>{book.title}</td>
                    <td>{book.authors.join(', ')}</td>
                    <td>{book.publisher}{book.publishYear && `, ${book.publishYear}`}</td>
                    <td className="likes-cell">{book.likes}</td>
                    <td>{book.reviews.length}</td>
                  </tr>
                  {expandedBookId === book.id && (
                    <tr className="expanded-row">
                      <td colSpan="7">
                        {renderExpandedBook(book)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <div className="no-data">No books to display.</div>
        )}
        {loading && books.length > 0 && <div className="loading-more">Loading more books...</div>}
      </div>
    </div>
  );
}

export default App;