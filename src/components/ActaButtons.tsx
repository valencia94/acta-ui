import { DownloadIcon, FileTextIcon, SendIcon } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/Button";

interface ActaButtonsProps {
  onGenerate: () => void;
  onDownloadWord: () => void;
  onDownloadPdf: () => void;
  onSendForApproval: () => void;
}

export default function ActaButtons({
  onGenerate,
  onDownloadWord,
  onDownloadPdf,
  onSendForApproval,
}: ActaButtonsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <Button
        onClick={onGenerate}
        className="bg-ikusi-green hover:bg-emerald-600 text-white rounded-lg flex gap-2 justify-center items-center"
      >
        <DownloadIcon className="w-4 h-4" /> Generate Acta
      </Button>

      <Button
        onClick={onSendForApproval}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex gap-2 justify-center items-center"
      >
        <SendIcon className="w-4 h-4" /> Send for Approval
      </Button>

      <Button
        onClick={onDownloadWord}
        className="border border-gray-300 hover:bg-gray-50 rounded-lg flex gap-2 justify-center items-center"
      >
        <FileTextIcon className="w-4 h-4" /> Download (.docx)
      </Button>

      <Button
        onClick={onDownloadPdf}
        className="border border-gray-300 hover:bg-gray-50 rounded-lg flex gap-2 justify-center items-center"
      >
        <FileTextIcon className="w-4 h-4" /> Download (.pdf)
      </Button>
    </div>
  );
}
