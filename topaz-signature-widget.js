/**
 * Topaz Signature Widget for Jotform
 * Integrates Topaz Signature Pad with Jotform Smart PDF mapping
 */

(function() {
    'use strict';
    
    // Widget configuration
    const CONFIG = {
        sigwebUrl: 'https://www.sigplusweb.com',
        canvasWidth: 500,
        canvasHeight: 200,
        imageFormat: 'PNG',
        imageQuality: 1.0
    };
    
    // Widget state
    let widgetState = {
        deviceConnected: false,
        signatureCaptured: false,
        signatureData: null,
        signatureImage: null,
        tabletTimer: null,
        canvasContext: null,
        justFinishedCapture: false,
        connectionCheckInterval: null
    };
    
    // DOM elements
    const elements = {
        container: null,
        deviceStatus: null,
        signatureCanvas: null,
        signatureDisplay: null,
        captureBtn: null,
        clearBtn: null,
        acceptBtn: null,
        signatureInfo: null,
        signatureTimestamp: null,
        signatureDataInput: null,
        signatureImageInput: null
    };
    
    /**
     * Initialize the widget
     */
    function init() {
        // Get DOM elements
        elements.container = document.getElementById('topazSignatureContainer');
        elements.deviceStatus = document.getElementById('deviceStatus');
        elements.signatureCanvas = document.getElementById('signatureCanvas');
        elements.signatureDisplay = document.getElementById('signatureDisplay');
        elements.captureBtn = document.getElementById('captureBtn');
        elements.clearBtn = document.getElementById('clearBtn');
        elements.acceptBtn = document.getElementById('acceptBtn');
        elements.signatureInfo = document.getElementById('signatureInfo');
        elements.signatureTimestamp = document.getElementById('signatureTimestamp');
        elements.signatureDataInput = document.getElementById('signatureData');
        elements.signatureImageInput = document.getElementById('signatureImage');
        
        // Initialize Topaz SigWeb
        initializeTopaz();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup Jotform integration
        setupJotformIntegration();
    }
    
    /**
     * Initialize Topaz SigWeb SDK
     */
    function initializeTopaz() {
        try {
            // Set initial status
            updateDeviceStatus('Initializing Topaz Signature Pad...', 'info');
            
            // Check if SigWebTablet.js is loaded by trying to call GetTabletState
            // This is the same pattern used in the working example
            if (typeof GetTabletState === 'undefined') {
                updateDeviceStatus('SigWeb SDK not loaded. Please ensure SigWebTablet.js is loaded.', 'error');
                return;
            }
            
            try {
                // Try to call GetTabletState to see if service is available
                GetTabletState();
            } catch (e) {
                console.log('SigWeb service not available:', e);
                updateDeviceStatus('SigWeb service not installed. Please install SigWeb software.', 'error');
                return;
            }
            
            // Get canvas context for tablet display
            if (elements.signatureCanvas) {
                widgetState.canvasContext = elements.signatureCanvas.getContext('2d');
            } else {
                updateDeviceStatus('Canvas element not found', 'error');
                return;
            }
            
            // Check device connection immediately
            checkDeviceConnection();
            
            // Setup periodic connection check (every 3 seconds)
            widgetState.connectionCheckInterval = setInterval(checkDeviceConnection, 3000);
            
        } catch (error) {
            console.error('Error initializing Topaz:', error);
            updateDeviceStatus('Error initializing Topaz Signature Pad: ' + error.message, 'error');
        }
    }
    
    /**
     * Check if Topaz device is connected
     * Note: GetTabletState() returns 1 when active, 0 when inactive (but hardware may still be connected)
     * The key insight: if GetTabletState() doesn't throw, the service/hardware is available
     */
    function checkDeviceConnection() {
        try {
            // Check if SigWeb functions are available
            if (typeof GetTabletState === 'undefined') {
                updateDeviceStatus('SigWeb functions not available', 'error');
                return;
            }
            
            // If we just finished a capture, skip this check (tablet is intentionally inactive)
            if (widgetState.justFinishedCapture) {
                // Reset flag after a delay
                setTimeout(function() {
                    widgetState.justFinishedCapture = false;
                }, 2000);
                return;
            }
            
            // Try to get device status
            // If this succeeds (no error), the service/hardware is available
            const tabletState = GetTabletState();
            console.log('Tablet state:', tabletState);
            
            // TabletState returns 1 if active, 0 if inactive
            const isActive = tabletState === '1' || tabletState === 1 || tabletState === '1\n' || tabletState === '1\r\n';
            
            // If we can call GetTabletState without error, hardware/service is available
            // We consider it "connected" if we can communicate with it, even if not currently active
            if (isActive) {
                // Tablet is active
                if (!widgetState.deviceConnected) {
                    widgetState.deviceConnected = true;
                    updateDeviceStatus('Topaz Signature Pad connected', 'success');
                    enableControls();
                }
            } else {
                // Tablet is inactive (state = 0)
                // If we've successfully connected before, assume hardware is still available
                // Only show "not connected" on first check or if we get an error
                if (!widgetState.deviceConnected) {
                    // First check - device not active yet, but service is available
                    // Show as ready/available since we can communicate with it
                    widgetState.deviceConnected = true;
                    updateDeviceStatus('Topaz Signature Pad ready', 'success');
                    enableControls();
                }
                // If already marked as connected, keep it that way (just inactive, not disconnected)
            }
        } catch (error) {
            console.error('Error checking device connection:', error);
            // Only mark as disconnected if there's a real error (service unavailable)
            widgetState.deviceConnected = false;
            updateDeviceStatus('Topaz Signature Pad not connected. Please connect the device.', 'warning');
            disableControls();
        }
    }
    
    /**
     * Update device status message
     */
    function updateDeviceStatus(message, type = 'info') {
        if (elements.deviceStatus) {
            elements.deviceStatus.textContent = message;
            elements.deviceStatus.className = 'device-status status-' + type;
        }
    }
    
    /**
     * Enable signature controls
     */
    function enableControls() {
        if (elements.captureBtn) elements.captureBtn.disabled = false;
        if (elements.clearBtn) elements.clearBtn.disabled = false;
    }
    
    /**
     * Disable signature controls
     */
    function disableControls() {
        if (elements.captureBtn) elements.captureBtn.disabled = true;
        if (elements.clearBtn) elements.clearBtn.disabled = true;
        if (elements.acceptBtn) elements.acceptBtn.disabled = true;
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Capture button
        if (elements.captureBtn) {
            elements.captureBtn.addEventListener('click', captureSignature);
        }
        
        // Clear button
        if (elements.clearBtn) {
            elements.clearBtn.addEventListener('click', clearSignature);
        }
        
        // Accept button
        if (elements.acceptBtn) {
            elements.acceptBtn.addEventListener('click', acceptSignature);
        }
    }
    
    /**
     * Capture signature from Topaz pad
     * Based on working example from https://github.com/ed-hughes/ed-hughes.github.io/blob/main/topaz_example.html
     */
    function captureSignature() {
        try {
            if (!widgetState.deviceConnected || !widgetState.canvasContext) {
                alert('Topaz Signature Pad is not connected. Please connect the device and try again.');
                return;
            }
            
            var ctx = widgetState.canvasContext;
            var canvas = elements.signatureCanvas;
            
            // Set display size to match canvas (following example pattern)
            if (typeof SetDisplayXSize !== 'undefined') {
                SetDisplayXSize(canvas.width);
            }
            if (typeof SetDisplayYSize !== 'undefined') {
                SetDisplayYSize(canvas.height);
            }
            
            // Clear any existing tablet state and timer
            if (widgetState.tabletTimer) {
                SetTabletState(0, widgetState.tabletTimer);
                widgetState.tabletTimer = null;
            } else {
                SetTabletState(0, null);
            }
            
            // Set justify mode (from example)
            if (typeof SetJustifyMode !== 'undefined') {
                SetJustifyMode(0);
            }
            
            // Clear tablet before starting
            if (typeof ClearTablet !== 'undefined') {
                ClearTablet();
            }
            
            // Connect tablet to canvas with 50ms refresh rate (matching example)
            widgetState.tabletTimer = SetTabletState(1, ctx, 50);
            
            // Update UI
            updateDeviceStatus('Please sign on the pad, then click Accept Signature...', 'info');
            elements.captureBtn.disabled = true;
            elements.clearBtn.disabled = false;
            elements.acceptBtn.disabled = false;
            
        } catch (error) {
            console.error('Error starting signature capture:', error);
            alert('Error starting signature capture: ' + error.message);
            elements.captureBtn.disabled = false;
            updateDeviceStatus('Error: ' + error.message, 'error');
        }
    }
    
    /**
     * Display signature on canvas
     */
    function displaySignature(imageData) {
        try {
            const canvas = elements.signatureCanvas;
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Create image from data
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                elements.signatureDisplay.classList.add('has-signature');
            };
            
            // Handle different image data formats
            if (typeof imageData === 'string') {
                if (imageData.startsWith('data:image')) {
                    img.src = imageData;
                } else if (imageData.startsWith('http')) {
                    img.src = imageData;
                } else {
                    // Assume base64
                    img.src = 'data:image/png;base64,' + imageData;
                }
            } else {
                // Try to convert to base64
                img.src = 'data:image/png;base64,' + btoa(String.fromCharCode.apply(null, imageData));
            }
            
        } catch (error) {
            console.error('Error displaying signature:', error);
        }
    }
    
    /**
     * Clear signature
     * Based on working example pattern
     */
    function clearSignature() {
        try {
            // Clear canvas
            const canvas = elements.signatureCanvas;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Clear tablet (from example)
            if (typeof ClearTablet !== 'undefined') {
                ClearTablet();
            }
            
            // Reset state
            widgetState.signatureCaptured = false;
            widgetState.signatureData = null;
            widgetState.signatureImage = null;
            
            // Clear hidden inputs
            if (elements.signatureDataInput) elements.signatureDataInput.value = '';
            if (elements.signatureImageInput) elements.signatureImageInput.value = '';
            
            // Update UI
            elements.signatureDisplay.classList.remove('has-signature');
            elements.signatureInfo.style.display = 'none';
            elements.acceptBtn.disabled = true;
            
            updateDeviceStatus('Signature cleared', 'info');
            
        } catch (error) {
            console.error('Error clearing signature:', error);
        }
    }
    
    /**
     * Accept signature and submit to Jotform
     * Based on working example pattern
     */
    function acceptSignature() {
        try {
            // Check if signature exists (following example pattern)
            if (typeof NumberOfTabletPoints === 'undefined' || NumberOfTabletPoints() == 0) {
                alert('Please sign before continuing');
                return;
            }
            
            // Disconnect tablet first (from example)
            if (widgetState.tabletTimer) {
                SetTabletState(0, widgetState.tabletTimer);
                widgetState.tabletTimer = null;
            }
            
            // Mark that we just finished capture to prevent false "disconnected" status
            widgetState.justFinishedCapture = true;
            
            // Set compression mode and image properties before getting signature
            if (typeof SetSigCompressionMode !== 'undefined') {
                SetSigCompressionMode(1);
            }
            
            var canvas = elements.signatureCanvas;
            if (typeof SetImageXSize !== 'undefined') {
                SetImageXSize(canvas.width);
            }
            if (typeof SetImageYSize !== 'undefined') {
                SetImageYSize(canvas.height);
            }
            if (typeof SetImagePenWidth !== 'undefined') {
                SetImagePenWidth(5);
            }
            
            // Get signature string (Topaz format with biometric info)
            if (typeof GetSigString !== 'undefined') {
                widgetState.signatureData = GetSigString();
                console.log('SigString: ' + widgetState.signatureData);
            }
            
            // Get signature image as base64 (callback pattern from example)
            if (typeof GetSigImageB64 !== 'undefined') {
                GetSigImageB64(function(base64Image) {
                    if (base64Image && base64Image.length > 0) {
                        widgetState.signatureImage = base64Image;
                        
                        // Store as data URL (matching example format)
                        var imageDataUrl = 'data:image/jpeg;base64,' + base64Image;
                        
                        // Display signature on canvas
                        displaySignature(imageDataUrl);
                        
                        // Mark as captured
                        widgetState.signatureCaptured = true;
                        
                        // Convert canvas to base64 for storage
                        const canvas = elements.signatureCanvas;
                        const imageBase64 = canvas.toDataURL('image/png');
                        
                        // Update hidden inputs
                        if (elements.signatureDataInput) {
                            elements.signatureDataInput.value = JSON.stringify({
                                signatureData: widgetState.signatureData,
                                timestamp: new Date().toISOString(),
                                format: 'topaz-sigweb'
                            });
                        }
                        
                        if (elements.signatureImageInput) {
                            elements.signatureImageInput.value = imageBase64;
                        }
                        
                        // Update UI
                        elements.signatureInfo.style.display = 'block';
                        elements.signatureTimestamp.textContent = 'Captured: ' + new Date().toLocaleString();
                        elements.acceptBtn.disabled = true;
                        elements.captureBtn.disabled = false;
                        elements.clearBtn.disabled = true;
                        
                        // Trigger Jotform field update
                        updateJotformField();
                        
                        updateDeviceStatus('Signature accepted and saved', 'success');
                    } else {
                        alert('No signature image captured. Please try again.');
                        elements.acceptBtn.disabled = false;
                        updateDeviceStatus('Signature capture failed. Please try again.', 'error');
                    }
                });
            } else {
                alert('Unable to get signature image. Please ensure SigWebTablet.js is loaded.');
            }
            
        } catch (error) {
            console.error('Error accepting signature:', error);
            alert('Error accepting signature: ' + error.message);
            elements.acceptBtn.disabled = false;
        }
    }
    
    /**
     * Setup Jotform integration
     */
    function setupJotformIntegration() {
        // Wait for Jotform to be ready
        if (typeof window.JFCustomWidget !== 'undefined') {
            registerWithJotform();
        } else {
            // Wait for Jotform to load
            window.addEventListener('load', function() {
                setTimeout(registerWithJotform, 1000);
            });
        }
    }
    
    /**
     * Register widget with Jotform
     */
    function registerWithJotform() {
        try {
            // Jotform custom widget API
            if (typeof window.JFCustomWidget !== 'undefined') {
                window.JFCustomWidget.subscribe('ready', function(data) {
                    console.log('Jotform widget ready:', data);
                });
                
                window.JFCustomWidget.subscribe('submit', function(data) {
                    // Ensure signature data is included in submission
                    if (widgetState.signatureCaptured) {
                        const signatureData = {
                            signatureData: widgetState.signatureData,
                            signatureImage: elements.signatureImageInput ? elements.signatureImageInput.value : null,
                            timestamp: new Date().toISOString()
                        };
                        
                        // Send to Jotform
                        window.JFCustomWidget.sendData({
                            signature: signatureData
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error registering with Jotform:', error);
        }
    }
    
    /**
     * Update Jotform field value
     */
    function updateJotformField() {
        try {
            // Try to find and update Jotform field
            const fieldName = getJotformFieldName();
            
            if (fieldName) {
                // Update field value using Jotform API
                if (typeof window.JFCustomWidget !== 'undefined') {
                    window.JFCustomWidget.sendData({
                        value: elements.signatureImageInput ? elements.signatureImageInput.value : '',
                        signatureData: elements.signatureDataInput ? elements.signatureDataInput.value : ''
                    });
                }
            }
        } catch (error) {
            console.error('Error updating Jotform field:', error);
        }
    }
    
    /**
     * Get Jotform field name from context
     */
    function getJotformFieldName() {
        // Try to get field name from various sources
        if (typeof window.JFCustomWidget !== 'undefined') {
            return window.JFCustomWidget.getWidgetSetting('fieldName') || 'signature';
        }
        return 'signature';
    }
    
    /**
     * Cleanup function to disconnect tablet on page unload
     * Based on working example pattern
     */
    function cleanup() {
        try {
            // Clear tablet and disconnect (matching example pattern)
            if (typeof ClearTablet !== 'undefined') {
                ClearTablet();
            }
            
            // Disconnect tablet state (pass timer to SetTabletState like in example)
            if (widgetState.tabletTimer) {
                if (typeof SetTabletState !== 'undefined') {
                    SetTabletState(0, widgetState.tabletTimer);
                }
                widgetState.tabletTimer = null;
            } else {
                if (typeof SetTabletState !== 'undefined') {
                    SetTabletState(0, null);
                }
            }
        } catch (error) {
            console.warn('Error during cleanup:', error);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
    
    // Export for external access if needed
    window.TopazSignatureWidget = {
        capture: captureSignature,
        clear: clearSignature,
        accept: acceptSignature,
        cleanup: cleanup,
        getSignature: function() {
            return {
                data: widgetState.signatureData,
                image: widgetState.signatureImage,
                captured: widgetState.signatureCaptured
            };
        }
    };
    
})();

