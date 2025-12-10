/**
 * Topaz Signature Widget for Jotform
 * Integrates Topaz Signature Pad with Jotform Smart PDF mapping
 */

(function() {
    'use strict';
    
    // Widget configuration
    const CONFIG = {
        sigwebUrl: 'https://www.topazsystems.com/sigweb',
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
        topazObject: null
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
            // Check if SigWeb is available
            if (typeof SigWeb === 'undefined') {
                updateDeviceStatus('SigWeb SDK not loaded. Please ensure SigWeb is installed.', 'error');
                return;
            }
            
            // Initialize Topaz object
            widgetState.topazObject = new SigWeb();
            
            // Check device connection
            checkDeviceConnection();
            
            // Setup periodic connection check
            setInterval(checkDeviceConnection, 5000);
            
        } catch (error) {
            console.error('Error initializing Topaz:', error);
            updateDeviceStatus('Error initializing Topaz Signature Pad: ' + error.message, 'error');
        }
    }
    
    /**
     * Check if Topaz device is connected
     */
    function checkDeviceConnection() {
        try {
            if (!widgetState.topazObject) {
                return;
            }
            
            // Try to get device status
            const deviceInfo = widgetState.topazObject.GetTabletState();
            
            if (deviceInfo && deviceInfo !== -1) {
                if (!widgetState.deviceConnected) {
                    widgetState.deviceConnected = true;
                    updateDeviceStatus('Topaz Signature Pad connected', 'success');
                    enableControls();
                }
            } else {
                if (widgetState.deviceConnected) {
                    widgetState.deviceConnected = false;
                    updateDeviceStatus('Topaz Signature Pad disconnected', 'warning');
                    disableControls();
                }
            }
        } catch (error) {
            if (widgetState.deviceConnected) {
                widgetState.deviceConnected = false;
                updateDeviceStatus('Error checking device: ' + error.message, 'error');
                disableControls();
            }
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
     */
    function captureSignature() {
        try {
            if (!widgetState.deviceConnected || !widgetState.topazObject) {
                alert('Topaz Signature Pad is not connected. Please connect the device and try again.');
                return;
            }
            
            updateDeviceStatus('Please sign on the pad...', 'info');
            elements.captureBtn.disabled = true;
            
            // Capture signature from Topaz pad
            // SigWeb methods may vary based on version, adjust as needed
            const signatureData = widgetState.topazObject.GetSigString();
            
            if (signatureData && signatureData.length > 0) {
                // Convert signature data to image
                const imageData = widgetState.topazObject.GetSigImage();
                
                // Store signature data
                widgetState.signatureData = signatureData;
                widgetState.signatureImage = imageData;
                
                // Display signature on canvas
                displaySignature(imageData);
                
                // Enable accept button
                elements.acceptBtn.disabled = false;
                elements.captureBtn.disabled = false;
                
                updateDeviceStatus('Signature captured. Click Accept to use it.', 'success');
                
            } else {
                alert('No signature data captured. Please try again.');
                elements.captureBtn.disabled = false;
                updateDeviceStatus('Signature capture failed. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('Error capturing signature:', error);
            alert('Error capturing signature: ' + error.message);
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
     */
    function clearSignature() {
        try {
            // Clear canvas
            const canvas = elements.signatureCanvas;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
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
            
            // Clear Topaz pad if connected
            if (widgetState.topazObject && widgetState.deviceConnected) {
                try {
                    widgetState.topazObject.ClearTablet();
                } catch (e) {
                    console.warn('Could not clear tablet:', e);
                }
            }
            
            updateDeviceStatus('Signature cleared', 'info');
            
        } catch (error) {
            console.error('Error clearing signature:', error);
        }
    }
    
    /**
     * Accept signature and submit to Jotform
     */
    function acceptSignature() {
        try {
            if (!widgetState.signatureData || !widgetState.signatureImage) {
                alert('No signature to accept. Please capture a signature first.');
                return;
            }
            
            // Mark as captured
            widgetState.signatureCaptured = true;
            
            // Convert image to base64 for storage
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
            
            // Trigger Jotform field update
            updateJotformField();
            
            updateDeviceStatus('Signature accepted and saved', 'success');
            
        } catch (error) {
            console.error('Error accepting signature:', error);
            alert('Error accepting signature: ' + error.message);
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
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for external access if needed
    window.TopazSignatureWidget = {
        capture: captureSignature,
        clear: clearSignature,
        accept: acceptSignature,
        getSignature: function() {
            return {
                data: widgetState.signatureData,
                image: widgetState.signatureImage,
                captured: widgetState.signatureCaptured
            };
        }
    };
    
})();

