# Topaz Signature Widget for Jotform

A custom Jotform widget that integrates with Topaz Signature Pad devices and maps captured signatures to Jotform Smart PDFs.

## Features

- ✅ Direct integration with Topaz Signature Pad hardware
- ✅ Real-time signature capture and display
- ✅ Automatic mapping to Jotform Smart PDF fields
- ✅ Signature data storage in multiple formats (image + metadata)
- ✅ Device connection status monitoring
- ✅ Responsive design for desktop and mobile
- ✅ Clean, modern UI

## Prerequisites

1. **Topaz Signature Pad Hardware**
   - Compatible models: T-S460, T-S460-HSB-R, T-LKB462, T-LKB462-HSB-R
   - Connected via USB

2. **Topaz SigWeb Software**
   - Download and install from [Topaz Systems](https://www.topazsystems.com)
   - Required for browser communication with the signature pad
   - The widget uses SigWebTablet.js API from [sigplusweb.com](https://www.sigplusweb.com)

3. **Jotform Account**
   - Access to Jotform Form Builder
   - Smart PDF Forms feature enabled

## Installation

### Step 1: Install Topaz SigWeb

1. Download SigWeb from the Topaz Systems website
2. Install on the computer that will be used to fill out forms
3. Ensure the Topaz Signature Pad is connected via USB
4. Test the connection using Topaz's test utilities

### Step 2: Upload Widget to Jotform

1. Log in to your Jotform account
2. Go to **Form Builder** → **Add Form Element** → **Widgets**
3. Click **Add Custom Widget** or **Upload Widget**
4. Upload the following files:
   - `topaz-signature-widget.html`
   - `topaz-signature-widget.js`
   - `topaz-signature-widget.css`
   - `widget-manifest.json` (optional, but recommended)

### Step 3: Add Widget to Your Form

1. In your Jotform form builder, click **Add Form Element**
2. Navigate to **Widgets** tab
3. Find and add the "Topaz Signature Widget"
4. Position it where you want the signature field

### Step 4: Configure Smart PDF Mapping

1. Create or upload your PDF document in Jotform
2. Enable **Smart PDF Forms** for your form
3. Open the Smart PDF editor
4. Locate the signature field in your online form (the Topaz widget)
5. Drag the signature field and drop it onto the signature area in your PDF
6. Adjust the size and position as needed
7. Save your Smart PDF configuration

## Usage

### For Form Fillers

1. **Connect Device**: Ensure the Topaz Signature Pad is connected via USB
2. **Check Status**: The widget will show "Topaz Signature Pad connected" when ready
3. **Capture Signature**: Click the "Capture Signature" button
4. **Sign on Pad**: Sign on the Topaz Signature Pad device
5. **Review**: The signature will appear on screen
6. **Accept**: Click "Accept Signature" to save it to the form
7. **Submit**: Complete and submit the form as usual

### For Form Creators

1. **Field Naming**: The widget creates hidden fields:
   - `signatureData`: JSON metadata about the signature
   - `signatureImage`: Base64-encoded PNG image

2. **Smart PDF Mapping**: 
   - Map `signatureImage` to signature fields in your PDF
   - Optionally map `signatureData` to text fields for metadata

3. **Form Validation**: 
   - The widget requires signature acceptance before form submission
   - You can add additional validation in Jotform's form settings

## File Structure

```
topaz-signature-widget/
├── topaz-signature-widget.html    # Main widget HTML structure
├── topaz-signature-widget.js      # Widget logic and Topaz integration
├── topaz-signature-widget.css     # Widget styling
├── widget-manifest.json           # Widget metadata and configuration
├── smart-pdf-mapping-config.json  # Configuration for Smart PDF mapping
└── README.md                      # This file
```

## Configuration

### Widget Settings

You can customize the widget by modifying `topaz-signature-widget.js`:

```javascript
const CONFIG = {
    sigwebUrl: 'https://www.sigplusweb.com',
    canvasWidth: 500,
    canvasHeight: 200,
    imageFormat: 'PNG',
    imageQuality: 1.0
};
```

**Note**: The widget uses the SigWebTablet.js API from `https://www.sigplusweb.com/SigWebTablet.js`, which provides function-based API methods instead of object-based methods.

### Smart PDF Mapping

Edit `smart-pdf-mapping-config.json` to adjust how signatures map to PDF fields:

- `fieldMapping.signatureImage`: Maps the signature image to PDF signature fields
- `fieldMapping.signatureData`: Maps signature metadata to PDF text fields

## Troubleshooting

### Device Not Detected

- **Check USB Connection**: Ensure the Topaz pad is properly connected
- **Verify SigWeb Installation**: Reinstall SigWeb if needed
- **Check SigWeb Service**: Ensure the SigWeb service is running (it should start automatically)
- **Browser Compatibility**: Use Chrome, Firefox, or Edge (latest versions)
- **Check Browser Permissions**: Allow access to USB devices if prompted
- **Refresh Page**: If device was just connected, try refreshing the page
- **Check Console**: Open browser developer tools (F12) to see connection status messages

### Signature Not Appearing

- **Check Device Status**: Look for error messages in the widget
- **Try Clearing**: Click "Clear" and try capturing again
- **Restart Browser**: Close and reopen the browser
- **Check SigWeb**: Verify SigWeb is running and can detect the device

### Smart PDF Mapping Issues

- **Field Names**: Ensure field names match between form and PDF
- **PDF Format**: Verify your PDF supports form fields
- **Mapping Order**: Map signature field before other fields
- **Test Submission**: Submit a test form to verify mapping

### Browser Compatibility

- ✅ Chrome/Edge (Chromium) - Recommended
- ✅ Firefox - Supported
- ⚠️ Safari - Limited support (may require additional configuration)
- ❌ Internet Explorer - Not supported

## API Reference

### JavaScript API

The widget exposes a global `TopazSignatureWidget` object:

```javascript
// Get current signature data
const signature = TopazSignatureWidget.getSignature();
console.log(signature.data);      // Signature data string (Topaz format)
console.log(signature.image);     // Base64 image
console.log(signature.captured);  // Boolean

// Get widget data for Jotform (returns {value, valid})
const widgetData = TopazSignatureWidget.getData();
console.log(widgetData.value);    // Base64 signature image
console.log(widgetData.valid);    // Validation status

// Programmatically trigger actions
TopazSignatureWidget.capture();   // Start signature capture
TopazSignatureWidget.clear();     // Clear signature
TopazSignatureWidget.accept();    // Accept signature
TopazSignatureWidget.cleanup();   // Cleanup and disconnect tablet
TopazSignatureWidget.resizeFrame(); // Resize widget frame
```

### Jotform Integration

The widget automatically integrates with Jotform's custom widget API:

- **JFCustomWidget API**: Uses Jotform's custom widget SDK for integration
- **Validation**: Implements `getData()` function that returns `{value, valid}` for form validation
- **Submit Handler**: Properly sends signature data on form submission using `sendSubmit()`
- **Real-time Updates**: Updates form fields when signature is accepted
- **Smart PDF Mapping**: Signature image is automatically mapped to PDF signature fields
- **Frame Resizing**: Widget automatically resizes to fit content

The widget includes:
- Jotform widget SDK script (`for-custom-widgets.js`)
- Proper validation with visual feedback
- Hidden form fields for signature data and image
- Automatic Smart PDF field mapping

## Security Considerations

- **Signature Data**: Stored as base64-encoded images
- **Transmission**: Data is sent securely through Jotform's HTTPS connection
- **Storage**: Signatures are stored according to Jotform's data retention policies
- **Privacy**: Ensure compliance with your organization's data privacy requirements

## Support

### Topaz Signature Pad Support
- Website: [www.topazsystems.com](https://www.topazsystems.com)
- Support: Contact Topaz Systems for hardware/software issues

### Jotform Support
- Documentation: [www.jotform.com/help](https://www.jotform.com/help)
- Support: Contact Jotform support for widget integration issues

## License

This widget is provided as-is for use with Jotform and Topaz Signature Pad devices. Please ensure you have proper licenses for:
- Jotform account and services
- Topaz Signature Pad hardware and software

## Version History

### v1.0.0
- Initial release
- Topaz Signature Pad integration using SigWebTablet.js API
- Smart PDF mapping support
- Jotform custom widget API integration
- Responsive design
- Device status monitoring
- Connection state management (distinguishes inactive vs disconnected)
- Validation UI with visual feedback
- Automatic frame resizing

## Contributing

To customize or extend this widget:

1. Modify the JavaScript file for functionality changes
2. Update CSS for styling changes
3. Adjust HTML structure as needed
4. Test thoroughly with your Topaz device
5. Verify Smart PDF mapping works correctly

## Notes

- The widget requires SigWeb to be installed on the client machine
- The widget uses SigWebTablet.js API from `https://www.sigplusweb.com/SigWebTablet.js`
- Signature capture only works when the Topaz pad is physically connected
- The widget properly handles tablet state (active vs inactive vs disconnected)
- After accepting a signature, the tablet is disconnected but remains available for next capture
- Smart PDF mapping requires Jotform's Smart PDF Forms feature
- The signature image is sent as base64-encoded data for Smart PDF compatibility
- Test the widget in your specific environment before deploying to production

## Technical Details

### API Usage

The widget uses the SigWebTablet.js function-based API:

- `IsSigWebInstalled()` - Checks if SigWeb service is available
- `GetTabletState()` - Gets current tablet state (1 = active, 0 = inactive)
- `SetTabletState(state, context, refreshRate)` - Connects/disconnects tablet to canvas
- `OpenTablet(port)` - Opens tablet connection
- `CloseTablet()` - Closes tablet connection
- `ClearTablet()` - Clears signature from tablet
- `GetSigString()` - Gets signature in Topaz format
- `GetSigImageB64(callback)` - Gets signature as base64 image
- `NumberOfTabletPoints()` - Checks if signature exists

### Jotform Widget API

The widget implements:

- `getData()` - Returns `{value: base64Image, valid: boolean}` for validation
- `JFCustomWidget.subscribe('ready')` - Handles widget initialization
- `JFCustomWidget.subscribe('submit')` - Handles form submission
- `JFCustomWidget.sendData()` - Sends data updates to Jotform
- `JFCustomWidget.sendSubmit()` - Sends final data on form submit
- `JFCustomWidget.requestFrameResize()` - Resizes widget frame

