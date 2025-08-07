// src/components/PDFPreview.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Download, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

interface PDFPreviewProps {
  isOpen: boolean;
  pdfUrl: string;
  fileName: string;
  onClose: () => void;
}

export default function PDFPreview({ isOpen, pdfUrl, fileName, onClose }: PDFPreviewProps): JSX.Element {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 bg-white border-b border-gray-200 px-6 py-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
                <span className="text-sm text-gray-500">{fileName}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <span className="text-sm text-gray-600 min-w-[60px] text-center">{zoom}%</span>

                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-2" />

                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>

                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* PDF Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex-1 p-6 overflow-auto bg-gray-100"
          >
            <div className="flex justify-center">
              <div
                className="bg-white shadow-2xl rounded-lg overflow-hidden"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-in-out',
                }}
              >
                <iframe
                  src={pdfUrl}
                  className="w-[800px] h-[1000px] border-0"
                  title="PDF Preview"
                />
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-10 bg-white border-t border-gray-200 px-6 py-3"
          >
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to close
              </div>
              <div>Use mouse wheel or zoom buttons to adjust size</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
