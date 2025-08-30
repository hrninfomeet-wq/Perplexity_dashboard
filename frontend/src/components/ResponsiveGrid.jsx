// frontend/src/components/ResponsiveGrid.jsx
import React, { useState, useEffect, useRef } from 'react';

const ResponsiveGrid = ({ children }) => {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [visiblePanels, setVisiblePanels] = useState({
        fno: true,
        market: true,
        scalping: true,
        settings: true
    });
    const gridRef = useRef(null);

    // Calculate optimal panel sizes based on screen width
    const calculatePanelSizes = (width) => {
        if (width >= 1400) {
            return {
                columns: 4,
                layout: 'desktop',
                panelWidth: {
                    fno: '350px',
                    market: '400px',
                    scalping: '350px',
                    settings: '320px'
                }
            };
        } else if (width >= 1024) {
            return {
                columns: 3,
                layout: 'large-tablet',
                panelWidth: {
                    fno: '380px',
                    market: '400px',
                    scalping: '100%',
                    settings: '320px'
                }
            };
        } else if (width >= 768) {
            return {
                columns: 2,
                layout: 'tablet',
                panelWidth: {
                    fno: '1fr',
                    market: '1fr',
                    scalping: '1fr',
                    settings: '1fr'
                }
            };
        } else {
            return {
                columns: 1,
                layout: 'mobile',
                panelWidth: {
                    fno: '1fr',
                    market: '1fr',
                    scalping: '1fr',
                    settings: '1fr'
                }
            };
        }
    };

    // Handle window resize events
    const handleResize = () => {
        const newWidth = window.innerWidth;
        setScreenWidth(newWidth);
        
        // Update panel visibility based on new layout
        const config = calculatePanelSizes(newWidth);
        updatePanelVisibility(config);
    };

    // Update panel visibility based on scroll position and layout
    const updatePanelVisibility = (config) => {
        if (!gridRef.current) return;

        const container = gridRef.current;
        const containerRect = container.getBoundingClientRect();
        const panels = container.querySelectorAll('.panel-wrapper');

        const newVisibility = {};

        panels.forEach((panel) => {
            const panelRect = panel.getBoundingClientRect();
            const panelId = panel.getAttribute('data-panel-id');
            
            // Check if panel is visible in viewport
            const isVisible = (
                panelRect.left < containerRect.right &&
                panelRect.right > containerRect.left &&
                panelRect.top < containerRect.bottom &&
                panelRect.bottom > containerRect.top
            );

            newVisibility[panelId] = isVisible;
        });

        setVisiblePanels(newVisibility);
    };

    // Get panel configuration for current breakpoint
    const getPanelConfiguration = (width) => {
        const config = calculatePanelSizes(width);
        
        switch (config.layout) {
            case 'desktop':
                return {
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gridTemplateAreas: '"fno market scalping settings"',
                    maxWidth: '100%',
                    margin: '0',
                    minWidth: '1400px'
                };
            case 'large-tablet':
                return {
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gridTemplateAreas: '"fno market scalping settings"',
                    minWidth: '1200px',
                    margin: '0',
                    maxWidth: '100%'
                };
            case 'tablet':
                return {
                    gridTemplateColumns: '1fr 1fr',
                    gridTemplateAreas: '"fno market" "scalping settings"',
                    minWidth: 'auto',
                    margin: '0',
                    maxWidth: '100%'
                };
            case 'mobile':
                return {
                    gridTemplateColumns: '1fr',
                    gridTemplateAreas: '"fno" "market" "scalping" "settings"',
                    minWidth: 'auto',
                    margin: '0',
                    maxWidth: '100%'
                };
            default:
                return {
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    gridTemplateAreas: '"fno market scalping settings"',
                    minWidth: '1200px',
                    margin: '0',
                    maxWidth: '100%'
                };
        }
    };

    // Scroll to specific panel
    const scrollToPanel = (panelId) => {
        const panel = gridRef.current?.querySelector(`[data-panel-id="${panelId}"]`);
        if (panel) {
            panel.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    };

    // Setup event listeners
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        
        // Initial visibility check
        const config = calculatePanelSizes(screenWidth);
        updatePanelVisibility(config);

        // Setup intersection observer for better visibility tracking
        const observer = new IntersectionObserver(
            (entries) => {
                const newVisibility = { ...visiblePanels };
                entries.forEach((entry) => {
                    const panelId = entry.target.getAttribute('data-panel-id');
                    newVisibility[panelId] = entry.isIntersecting;
                });
                setVisiblePanels(newVisibility);
            },
            {
                threshold: 0.1,
                rootMargin: '0px'
            }
        );

        // Observe all panels
        const panels = gridRef.current?.querySelectorAll('.panel-wrapper');
        panels?.forEach((panel) => observer.observe(panel));

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [screenWidth]);

    // Get current panel configuration
    const panelConfig = getPanelConfiguration(screenWidth);
    const layoutConfig = calculatePanelSizes(screenWidth);

    return (
        <div className="responsive-dashboard-container">
            <div 
                ref={gridRef}
                className="adaptive-grid horizontal-scroll-area"
                style={{
                    gridTemplateColumns: panelConfig.gridTemplateColumns,
                    gridTemplateAreas: panelConfig.gridTemplateAreas,
                    maxWidth: panelConfig.maxWidth,
                    minWidth: panelConfig.minWidth,
                    margin: panelConfig.margin
                }}
            >
                {React.Children.map(children, (child, index) => {
                    if (!React.isValidElement(child)) return child;

                    // Determine panel ID based on component type or props
                    let panelId = 'panel';
                    let panelClass = 'panel-wrapper';

                    if (child.type?.name === 'FnOAnalysis') {
                        panelId = 'fno';
                        panelClass += ' fno-panel';
                    } else if (child.type?.name === 'MarketAnalysis') {
                        panelId = 'market';
                        panelClass += ' market-panel';
                    } else if (child.type?.name === 'ScalpingOpportunities') {
                        panelId = 'scalping';
                        panelClass += ' scalping-panel';
                    } else if (child.type?.name === 'Sidebar') {
                        panelId = 'settings';
                        panelClass += ' settings-panel';
                    }

                    return (
                        <div
                            key={panelId}
                            className={panelClass}
                            data-panel-id={panelId}
                            style={{
                                gridArea: panelId
                            }}
                        >
                            <div className="panel-header">
                                <div className="panel-title">
                                    {child.type?.name || `Panel ${index + 1}`}
                                </div>
                                <div className="panel-actions">
                                    {layoutConfig.layout !== 'mobile' && (
                                        <button
                                            className="panel-expand-btn"
                                            onClick={() => scrollToPanel(panelId)}
                                            title="Focus on this panel"
                                        >
                                            ⊡
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="panel-content">
                                {child}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Panel Visibility Indicator */}
            {layoutConfig.layout !== 'mobile' && (
                <div className="panel-visibility-indicator">
                    {Object.entries(visiblePanels).map(([panelId, isVisible]) => (
                        <div
                            key={panelId}
                            className={`visibility-dot ${isVisible ? 'visible' : 'hidden'}`}
                            onClick={() => scrollToPanel(panelId)}
                            title={`${panelId.toUpperCase()} Panel ${isVisible ? '(Visible)' : '(Hidden)'}`}
                        />
                    ))}
                </div>
            )}

            {/* Layout Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 9999
                }}>
                    Layout: {layoutConfig.layout} | Width: {screenWidth}px | Columns: {layoutConfig.columns}
                </div>
            )}
        </div>
    );
};

export default ResponsiveGrid;
