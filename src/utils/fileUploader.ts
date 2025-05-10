
import axios from 'axios';

// Function to generate a unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = originalName.split('.').pop() || 'png';
  return `logo-${timestamp}-${random}.${ext}`;
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Save file to public folder and return the path
export const saveFileToPublic = async (file: File): Promise<string> => {
  try {
    console.log('FileUploader: Processing file', file.name, file.type, file.size);
    
    // Convert the file to base64 first
    const base64Data = await fileToBase64(file);
    console.log('FileUploader: Converted file to base64');
    
    // Create a unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    console.log('FileUploader: Generated unique filename:', uniqueFilename);
    
    // Define the path where the file will be saved in the lovable-uploads folder
    const savePath = `/lovable-uploads/${uniqueFilename}`;
    console.log('FileUploader: Save path:', savePath);
    
    // Create an image element from the base64 data
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => {
        console.error('FileUploader: Error loading image:', e);
        reject(new Error('Failed to load image'));
      };
      img.src = base64Data;
    });
    
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the image on the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    ctx.drawImage(img, 0, 0);
    
    // Get the image data as blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, file.type);
    });
    
    // Create form data for the upload
    const formData = new FormData();
    formData.append('file', blob, uniqueFilename);
    
    console.log('FileUploader: Uploading to /api/upload endpoint');
    // Upload to lovable's upload endpoint
    const response = await axios.post('/api/upload', formData);
    
    // Add defensive check against null/undefined response
    if (!response || !response.data) {
      console.error('FileUploader: Received invalid response from server');
      throw new Error('Invalid response from server: empty response');
    }
    
    // Check if the response.data exists and contains a url
    if (typeof response.data !== 'object' || !response.data.url) {
      console.error('FileUploader: Invalid response structure:', response.data);
      throw new Error('Invalid response from server: missing URL');
    }
    
    const fullUrl = response.data.url;
    console.log('FileUploader: File saved successfully:', fullUrl);
    return fullUrl;
  } catch (error) {
    console.error('FileUploader: Error saving file:', error);
    // Return base64 data as fallback if upload to public folder fails
    try {
      console.log('FileUploader: Attempting to use base64 data as fallback');
      const base64Data = await fileToBase64(file);
      return base64Data;
    } catch (innerError) {
      console.error('FileUploader: Fallback also failed:', innerError);
      throw error;
    }
  }
};
