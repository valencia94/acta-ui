// src/components/ActaButtons.tsx
import { motion } from "framer-motion";
import { Download, Eye, FileText, Send, Sparkles, Zap } from "lucide-react";

import Button from "@/components/Button";

interface ActaButtonsProps {
  onGenerate: () => void;
  onDownloadWord: () => void;
  onDownloadPdf: () => void;
  onPreviewPdf: () => void;
  onSendForApproval: () => void;
  disabled: boolean;
}

export default function ActaButtons({
  onGenerate,
  onDownloadWord,
  onDownloadPdf,
  onPreviewPdf,
  onSendForApproval,
  disabled,
}: ActaButtonsProps) {
  const handleClick = (action: () => void, actionName: string) => {
    if (disabled) {
      console.log(`${actionName} clicked but disabled`);
      return;
    }
    console.log(`${actionName} clicked`);
    action();
  };

  const buttonVariants = {
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95 },
    disabled: { scale: 1, opacity: 0.5 }
  };

  const glowVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.1, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Primary Action Buttons - Hero Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Generate Button - Premium Style */}
        <motion.div
          variants={buttonVariants}
          whileHover={!disabled ? "hover" : undefined}
          whileTap={!disabled ? "tap" : undefined}
          animate={disabled ? "disabled" : undefined}
          className="relative group"
        >
          {/* Glow Effect */}
          {!disabled && (
            <motion.div
              {...glowVariants}
              className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl blur-lg opacity-60"
            />
          )}
          
          <Button
            onClick={() => handleClick(onGenerate, "Generate Acta")}
            disabled={disabled}
            className={`
              relative flex items-center justify-center gap-3 w-full h-16 sm:h-18
              backdrop-blur-xl border border-white/20 rounded-2xl
              font-bold text-sm sm:text-base tracking-wide
              transition-all duration-500 ease-out
              focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent
              ${disabled 
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-br from-emerald-500/90 via-green-500/90 to-teal-500/90 text-white shadow-2xl hover:shadow-emerald-500/25'
              }
            `}
          >
            <div className={`p-2 rounded-full transition-all duration-300 ${disabled ? 'bg-gray-500/20' : 'bg-white/20 group-hover:bg-white/30'}`}>
              <FileText className="h-5 w-5" />
            </div>
            <span>Generate ACTA</span>
            {!disabled && <Sparkles className="h-4 w-4 opacity-80" />}
          </Button>
        </motion.div>

        {/* Send Approval Button - Premium Style */}
        <motion.div
          variants={buttonVariants}
          whileHover={!disabled ? "hover" : undefined}
          whileTap={!disabled ? "tap" : undefined}
          animate={disabled ? "disabled" : undefined}
          className="relative group"
        >
          {/* Glow Effect */}
          {!disabled && (
            <motion.div
              {...glowVariants}
              className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-60"
            />
          )}
          
          <Button
            onClick={() => handleClick(onSendForApproval, "Send for Approval")}
            disabled={disabled}
            className={`
              relative flex items-center justify-center gap-3 w-full h-16 sm:h-18
              backdrop-blur-xl border border-white/20 rounded-2xl
              font-bold text-sm sm:text-base tracking-wide
              transition-all duration-500 ease-out
              focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent
              ${disabled 
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-br from-blue-500/90 via-purple-500/90 to-pink-500/90 text-white shadow-2xl hover:shadow-purple-500/25'
              }
            `}
          >
            <div className={`p-2 rounded-full transition-all duration-300 ${disabled ? 'bg-gray-500/20' : 'bg-white/20 group-hover:bg-white/30'}`}>
              <Send className="h-5 w-5" />
            </div>
            <span>Send Approval</span>
            {!disabled && <Zap className="h-4 w-4 opacity-80" />}
          </Button>
        </motion.div>
      </div>

      {/* Secondary Actions - Modern Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Download Word */}
        <motion.div
          variants={buttonVariants}
          whileHover={!disabled ? "hover" : undefined}
          whileTap={!disabled ? "tap" : undefined}
          animate={disabled ? "disabled" : undefined}
          className="relative"
        >
          <Button
            onClick={() => handleClick(onDownloadWord, "Download Word")}
            disabled={disabled}
            className={`
              flex items-center justify-center gap-2 w-full h-12 sm:h-14
              backdrop-blur-md border border-white/20 rounded-xl
              font-semibold text-xs sm:text-sm tracking-wide
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-white/30
              ${disabled 
                ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' 
                : 'bg-white/10 text-white hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-xl'
              }
            `}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Word Document</span>
            <span className="sm:hidden">Word</span>
          </Button>
        </motion.div>

        {/* Preview PDF */}
        <motion.div
          variants={buttonVariants}
          whileHover={!disabled ? "hover" : undefined}
          whileTap={!disabled ? "tap" : undefined}
          animate={disabled ? "disabled" : undefined}
          className="relative"
        >
          <Button
            onClick={() => handleClick(onPreviewPdf, "Preview PDF")}
            disabled={disabled}
            className={`
              flex items-center justify-center gap-2 w-full h-12 sm:h-14
              backdrop-blur-md border border-white/20 rounded-xl
              font-semibold text-xs sm:text-sm tracking-wide
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-white/30
              ${disabled 
                ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' 
                : 'bg-white/10 text-white hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-xl'
              }
            `}
          >
            <Eye className="h-4 w-4" />
            <span>Preview PDF</span>
          </Button>
        </motion.div>

        {/* Download PDF */}
        <motion.div
          variants={buttonVariants}
          whileHover={!disabled ? "hover" : undefined}
          whileTap={!disabled ? "tap" : undefined}
          animate={disabled ? "disabled" : undefined}
          className="relative"
        >
          <Button
            onClick={() => handleClick(onDownloadPdf, "Download PDF")}
            disabled={disabled}
            className={`
              flex items-center justify-center gap-2 w-full h-12 sm:h-14
              backdrop-blur-md border border-white/20 rounded-xl
              font-semibold text-xs sm:text-sm tracking-wide
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-white/30
              ${disabled 
                ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' 
                : 'bg-white/10 text-white hover:bg-white/20 hover:border-white/30 shadow-lg hover:shadow-xl'
              }
            `}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF Document</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </motion.div>
      </div>

      {/* Enhanced Status Message */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6 text-center"
      >
        <div className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border
          transition-all duration-300
          ${disabled 
            ? 'bg-orange-500/10 border-orange-400/20 text-orange-200' 
            : 'bg-green-500/10 border-green-400/20 text-green-200'
          }
        `}>
          <div className={`w-2 h-2 rounded-full ${disabled ? 'bg-orange-400' : 'bg-green-400'} animate-pulse`} />
          <p className="text-xs sm:text-sm font-medium">
            {disabled
              ? "Select a project to unlock ACTA actions"
              : "Ready to generate, preview, download, or send for approval"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
