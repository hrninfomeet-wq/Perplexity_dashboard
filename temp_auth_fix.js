// Temporary script to immediately show better authentication options
(function() {
    console.log('🔧 Applying immediate authentication fix...');
    
    // Check if the error modal is currently showing
    const modal = document.getElementById('error-modal');
    if (modal && modal.style.display === 'block') {
        console.log('📱 Modal currently showing, will refresh with better options...');
        
        // If dashboard is available, use its method
        if (window.dashboard && typeof window.dashboard.refreshAuthenticationOptions === 'function') {
            console.log('✅ Using dashboard refresh method');
            setTimeout(() => {
                window.dashboard.refreshAuthenticationOptions();
            }, 1000);
        } else {
            // Fallback: show a simple alert with the URL
            console.log('⚠️ Dashboard not ready, using fallback method');
            
            // Try to extract the URL from the current modal content
            const modalContent = modal.querySelector('.modal-body');
            if (modalContent) {
                const links = modalContent.querySelectorAll('a[href*="auth.flattrade.in"]');
                if (links.length > 0) {
                    const authUrl = links[0].href;
                    console.log('🔗 Found auth URL:', authUrl);
                    
                    // Show a better prompt with copy option
                    setTimeout(() => {
                        const userChoice = confirm(`🔗 Authentication URL Ready!\n\nThe big blue button might not work in this iframe environment.\n\nWould you like to:\n• Click OK to copy the URL to your clipboard\n• Click Cancel to see the URL in an alert\n\nYou can then paste it in a new browser tab.`);
                        
                        if (userChoice) {
                            // Try to copy to clipboard
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(authUrl).then(() => {
                                    alert(`✅ URL copied to clipboard!\n\nNow:\n1. Open a new browser tab\n2. Paste the URL (Ctrl+V or Cmd+V)\n3. Complete Flattrade authentication\n4. Return to this tab\n\nThe dashboard will auto-detect authentication.`);
                                }).catch(() => {
                                    alert(`📋 Copy failed, here's the URL:\n\n${authUrl}\n\nPlease copy this URL manually and paste it in a new browser tab.`);
                                });
                            } else {
                                alert(`📋 Here's the authentication URL:\n\n${authUrl}\n\nPlease copy this URL and paste it in a new browser tab to authenticate.`);
                            }
                        } else {
                            alert(`🔗 Authentication URL:\n\n${authUrl}\n\nCopy this URL and open it in a new browser tab to authenticate with Flattrade.`);
                        }
                    }, 500);
                }
            }
        }
    } else {
        console.log('ℹ️ No modal currently showing, user might need to click connect button first');
    }
})();
