/**
 * Nén ảnh trên Trình duyệt (Mobile & Desktop) trước khi lưu/tải lên
 * Giúp triệt tiêu lỗi QuotaExceededError trên Safari/Chrome Mobile và giảm dung lượng từ 10MB xuống ~15KB
 */
export const compressImage = (file: File, maxWidth = 200, maxHeight = 200, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const resultStr = e.target?.result as string;
      if (!resultStr) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
            return;
          }
        } catch (err) {
          console.warn('Canvas compression error:', err);
        }
        resolve(resultStr);
      };
      img.onerror = () => {
        resolve(resultStr);
      };
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
  });
};
