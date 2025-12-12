export const isValidFileType = (fileType: string) => {
  const validTypes = [
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    // Videos
    'mp4', 'quicktime', 'avi', 'x-msvideo', 'webm', 'ogg'
  ];
  return validTypes.includes(fileType.split('/')[1]);
};
