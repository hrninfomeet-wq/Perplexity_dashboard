import React, { useState, useCallback, useEffect } from 'react';
import './DraggableGrid.css';

const DraggableGrid = ({ children }) => {
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'trading-alerts', x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 2 },
      { i: 'fno-analysis', x: 0, y: 3, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'market-analysis', x: 6, y: 3, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'btst-scanner', x: 0, y: 9, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'scalping-opportunities', x: 6, y: 9, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'settings', x: 0, y: 15, w: 12, h: 3, minW: 6, minH: 2 }
    ]
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const onLayoutChange = useCallback((layout) => {
    setLayouts({ lg: layout });
    // Save to localStorage
    try {
      localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  }, []);

  // Load saved layout on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setLayouts({ lg: parsed });
      } catch (e) {
        console.error('Error loading saved layout:', e);
      }
    }
  }, []);

  const handleDragStart = (e, itemId) => {
    setDraggedItem(itemId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetId) {
      const newLayout = [...layouts.lg];
      const draggedIndex = newLayout.findIndex(item => item.i === draggedItem);
      const targetIndex = newLayout.findIndex(item => item.i === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Swap positions
        const draggedPos = { x: newLayout[draggedIndex].x, y: newLayout[draggedIndex].y };
        newLayout[draggedIndex].x = newLayout[targetIndex].x;
        newLayout[draggedIndex].y = newLayout[targetIndex].y;
        newLayout[targetIndex].x = draggedPos.x;
        newLayout[targetIndex].y = draggedPos.y;
        
        onLayoutChange(newLayout);
      }
    }
    setDraggedItem(null);
  };

  const resetLayout = () => {
    const defaultLayout = [
      { i: 'trading-alerts', x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 2 },
      { i: 'fno-analysis', x: 0, y: 3, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'market-analysis', x: 6, y: 3, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'btst-scanner', x: 0, y: 9, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'scalping-opportunities', x: 6, y: 9, w: 6, h: 6, minW: 4, minH: 4 },
      { i: 'settings', x: 0, y: 15, w: 12, h: 3, minW: 6, minH: 2 }
    ];
    setLayouts({ lg: defaultLayout });
    try {
      localStorage.setItem('dashboard-layout', JSON.stringify(defaultLayout));
    } catch (e) {
      console.error('Failed to save default layout:', e);
    }
  };

  if (!children || !Array.isArray(children)) {
    return (
      <div className="draggable-grid-container">
        <div className="error-message">
          <h3>No components to display</h3>
          <p>Please check that all components are properly imported.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="draggable-grid-container">
      <div className="grid-controls">
        <button className="reset-layout-btn" onClick={resetLayout}>
          🔄 Reset Layout
        </button>
        <span className="grid-info">Drag panels to rearrange • Scroll to see more</span>
      </div>
      
      <div className="grid-layout">
        {React.Children.map(children, (child, index) => {
          const layout = layouts.lg[index];
          const itemId = layout?.i || `panel-${index}`;
          
          if (!child) return null;
          
          return (
            <div 
              key={itemId}
              className={`grid-item ${draggedItem === itemId ? 'dragging' : ''}`}
              style={{
                gridColumn: `span ${layout?.w || 6}`,
                gridRow: `span ${layout?.h || 4}`,
                minWidth: `${(layout?.minW || 4) * 8.33}%`,
                minHeight: `${(layout?.minH || 3) * 60}px`
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, itemId)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, itemId)}
            >
              <div className="panel-wrapper">
                <div className="panel-header">
                  <div className="drag-handle">⋮⋮</div>
                  <div className="panel-title">{child.props?.title || 'Panel'}</div>
                  <div className="panel-controls">
                    <button className="minimize-btn" title="Minimize">−</button>
                    <button className="maximize-btn" title="Maximize">□</button>
                  </div>
                </div>
                <div className="panel-content">
                  {child}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DraggableGrid;
