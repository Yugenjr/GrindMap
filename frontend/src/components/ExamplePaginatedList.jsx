import React, { useState } from 'react';
import { usePagination } from '../hooks/usePagination';
import Pagination from './Pagination';
import SkeletonScreen from './SkeletonScreen';

/**
 * Example component demonstrating pagination and skeleton screens
 * This shows how to use the new performance features in your components
 */
const ExamplePaginatedList = () => {
  const [loading, setLoading] = useState(false);
  
  // Simulated data - replace with your actual data
  const mockData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
    date: new Date(2024, 0, i + 1).toLocaleDateString(),
  }));

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    totalItems,
    changeItemsPerPage,
  } = usePagination(mockData, 10);

  // Simulated loading state
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage]);

  if (loading) {
    return <SkeletonScreen type="list" count={itemsPerPage} />;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Example: Paginated List with Skeleton Loading</h2>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        marginBottom: '1rem' 
      }}>
        {paginatedItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.title}</h3>
            <p style={{ margin: '0 0 0.5rem 0', opacity: 0.8 }}>
              {item.description}
            </p>
            <small style={{ opacity: 0.6 }}>{item.date}</small>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onItemsPerPageChange={changeItemsPerPage}
      />
    </div>
  );
};

export default ExamplePaginatedList;

/**
 * Usage in your component:
 * 
 * import ExamplePaginatedList from './components/ExamplePaginatedList';
 * 
 * function App() {
 *   return <ExamplePaginatedList />;
 * }
 */

/**
 * How to adapt this for your data:
 * 
 * 1. Replace mockData with your actual data array
 * 2. Adjust the itemsPerPage (second parameter of usePagination)
 * 3. Customize the loading skeleton type ('list', 'grid', 'table', 'card')
 * 4. Style the item cards to match your design
 * 5. Add your own filtering/sorting logic before pagination
 * 
 * Example with API data:
 * 
 * const [data, setData] = useState([]);
 * const [loading, setLoading] = useState(true);
 * 
 * useEffect(() => {
 *   fetchData().then(result => {
 *     setData(result);
 *     setLoading(false);
 *   });
 * }, []);
 * 
 * const { paginatedItems, ... } = usePagination(data, 25);
 */
