
import axios from 'axios';

// Function to generate a unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = originalName.split('.').pop() || 'png';
  return `logo-${timestamp}-${random}.${ext}`;
};

// Save file to public folder and return the path
export const saveFileToPublic = async (file: File): Promise<string> => {
  try {
    console.log('FileUploader: Saving file to public folder', file.name);
    
    // Create a unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    
    // Define the path where the file will be saved
    // This will be in the public folder which is accessible via URL
    const savePath = `/lovable-uploads/${uniqueFilename}`;
    
    // Create a Blob URL for the file
    const blobUrl = URL.createObjectURL(file);
    
    // Create an image element to load the file
    const img = new Image();
    
    // Wait for the image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = blobUrl;
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
    
    // Upload to lovable's upload endpoint
    const response = await axios.post('/api/upload', formData);
    
    if (!response.data || !response.data.url) {
      throw new Error('Invalid response from server');
    }
    
    // Release the blob URL
    URL.revokeObjectURL(blobUrl);
    
    console.log('FileUploader: File saved successfully:', response.data.url);
    return response.data.url;
  } catch (error) {
    console.error('FileUploader: Error saving file:', error);
    throw error;
  }
};
