import apiClient from '@/services/api';

export function getImageUrl(relativePath) {
  if (!relativePath) {
    return null;
  }
  
  const baseUrl = apiClient.defaults.baseURL;
  
  const imagePath = relativePath.startsWith('/') 
    ? relativePath 
    : `/${relativePath}`;
    
  return `${baseUrl}${imagePath}`;
}