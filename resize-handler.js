// Resize handler for the webview sidebar
class ResizeHandler {
    constructor() {
        this.sidebar = document.querySelector('.webview-sidebar');
        this.resizeHandle = null;
        this.isResizing = false;
        this.lastDownX = 0;
        this.initialWidth = 0;
        
        this.init();
    }

    init() {
        // Create resize handle if it doesn't exist
        if (!document.querySelector('.resize-handle')) {
            this.resizeHandle = document.createElement('div');
            this.resizeHandle.className = 'resize-handle';
            this.sidebar.appendChild(this.resizeHandle);
            
            // Add event listeners
            this.resizeHandle.addEventListener('mousedown', this.startResize.bind(this));
            document.addEventListener('mousemove', this.handleResize.bind(this));
            document.addEventListener('mouseup', this.stopResize.bind(this));
            
            // Prevent text selection while resizing
            this.resizeHandle.addEventListener('selectstart', (e) => e.preventDefault());
        }
    }

    startResize(e) {
        this.isResizing = true;
        this.lastDownX = e.clientX;
        this.initialWidth = this.sidebar.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        this.resizeHandle.classList.add('active');
        
        // Prevent iframe from capturing mouse events
        const iframes = document.querySelectorAll('webview');
        iframes.forEach(iframe => {
            iframe.style.pointerEvents = 'none';
        });
    }

    handleResize(e) {
        if (!this.isResizing) return;
        
        e.preventDefault();
        
        // Calculate new width
        const deltaX = this.lastDownX - e.clientX;
        let newWidth = this.initialWidth + deltaX;
        
        // Apply constraints
        newWidth = Math.max(280, Math.min(1200, newWidth));
        
        // Update sidebar width and container width in the same frame
        requestAnimationFrame(() => {
            // Update sidebar width
            this.sidebar.style.width = `${newWidth}px`;
            
            // Update webview container
            const container = document.querySelector('.webview-container.sidebar-open');
            if (container) {
                const newContainerWidth = `calc(100% - ${newWidth + 20}px)`;
                container.style.width = newContainerWidth;
                container.style.maxWidth = newContainerWidth;
                container.style.minWidth = newContainerWidth; // Prevent container from collapsing
                
                // Force layout to prevent white space
                container.style.overflow = 'hidden';
                container.offsetHeight; // Trigger reflow
                container.style.overflow = '';
            }
        });
    }

    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.resizeHandle.classList.remove('active');
        
        // Re-enable iframe events
        const iframes = document.querySelectorAll('webview');
        iframes.forEach(iframe => {
            iframe.style.pointerEvents = '';
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize resize handler
    const resizeHandler = new ResizeHandler();
    
    // Re-initialize when sidebar is toggled
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const sidebar = document.querySelector('.webview-sidebar');
                if (sidebar && !document.querySelector('.resize-handle')) {
                    new ResizeHandler();
                }
            }
        });
    });
    
    // Start observing the sidebar for class changes
    const sidebar = document.querySelector('.webview-sidebar');
    if (sidebar) {
        observer.observe(sidebar, { attributes: true });
    }
});
