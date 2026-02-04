import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const FileUpload = ({
  onFileSelect,
  accept = '*',
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  disabled = false,
  label,
  helperText,
}) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB`;
    }
    return null;
  };

  const handleFiles = (fileList) => {
    setError('');
    const newFiles = Array.from(fileList);
    
    // Validate files
    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (multiple) {
      setFiles((prev) => [...prev, ...newFiles]);
      onFileSelect([...files, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
      onFileSelect(newFiles[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileSelect(multiple ? newFiles : null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-off-white mb-2">
          {label}
        </label>
      )}
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-cyan-mist bg-cyan-mist bg-opacity-10'
            : 'border-carbon-gray hover:border-stone-gray'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
        />
        
        <svg
          className="mx-auto h-12 w-12 text-stone-gray mb-3"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        <p className="text-off-white text-sm mb-1">
          {dragActive
            ? t('common.dropFiles') || 'Drop files here'
            : t('common.dragDropFiles') || 'Drag and drop files here, or click to select'}
        </p>
        <p className="text-stone-gray text-xs">
          {helperText || `Max size: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`}
        </p>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-midnight-navy-lighter border border-carbon-gray rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <svg
                  className="w-5 h-5 text-cyan-mist flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-off-white truncate">{file.name}</p>
                  <p className="text-xs text-stone-gray">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="ml-2 text-stone-gray hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
