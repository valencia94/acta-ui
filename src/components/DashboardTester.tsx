// src/components/DashboardTester.tsx
import { useEffect, useState } from 'react';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

export default function DashboardTester(): JSX.Element {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on dashboard
    if (window.location.pathname.includes('dashboard')) {
      setIsVisible(true);
    }
  }, []);

  const runQuickTest = async () => {
    const results = [];

    // Test 1: Check project ID input
    const projectIdInput = document.querySelector<HTMLInputElement>('#projectId');
    results.push({
      test: 'Project ID Input',
      status: projectIdInput ? 'pass' : 'fail',
      message: projectIdInput ? 'Found' : 'Missing',
    });

    // Test 2: Check buttons
    const buttons = document.querySelectorAll('button');
    const generateBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Generate'));
    const approvalBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Send Approval')
    );
    const wordBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Word'));
    const pdfBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('PDF'));

    results.push({
      test: 'Generate Button',
      status: generateBtn ? 'pass' : 'fail',
      message: generateBtn
        ? generateBtn.disabled
          ? 'Found (disabled)'
          : 'Found (enabled)'
        : 'Missing',
    });

    results.push({
      test: 'Send Approval Button',
      status: approvalBtn ? 'pass' : 'fail',
      message: approvalBtn
        ? approvalBtn.disabled
          ? 'Found (disabled)'
          : 'Found (enabled)'
        : 'Missing',
    });

    results.push({
      test: 'Word Download Button',
      status: wordBtn ? 'pass' : 'fail',
      message: wordBtn ? (wordBtn.disabled ? 'Found (disabled)' : 'Found (enabled)') : 'Missing',
    });

    results.push({
      test: 'PDF Download Button',
      status: pdfBtn ? 'pass' : 'fail',
      message: pdfBtn ? (pdfBtn.disabled ? 'Found (disabled)' : 'Found (enabled)') : 'Missing',
    });

    // Test 3: API connectivity
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999';
      const response = await fetch(`${apiUrl}/health`);
      results.push({
        test: 'API Connectivity',
        status: response.ok ? 'pass' : 'warn',
        message: response.ok ? 'API server reachable' : `API returned ${response.status}`,
      });
    } catch (_error) {
      results.push({
        test: 'API Connectivity',
        status: 'fail',
        message: 'API server not reachable',
      });
    }

    setTestResults(results);
  };

  const testButtonClick = (buttonName: string) => {
    const projectIdInput = document.querySelector<HTMLInputElement>('#projectId');
    if (projectIdInput && !projectIdInput.value) {
      projectIdInput.value = '1000000064013473';
      projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setTimeout(() => {
      const buttons = document.querySelectorAll('button');
      let targetBtn: HTMLButtonElement | null = null;

      if (buttonName === 'generate') {
        targetBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Generate'));
      } else if (buttonName === 'approval') {
        targetBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Send Approval'));
      } else if (buttonName === 'word') {
        targetBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('Word'));
      } else if (buttonName === 'pdf') {
        targetBtn = Array.from(buttons).find((btn) => btn.textContent?.includes('PDF'));
      }

      if (targetBtn && !targetBtn.disabled) {
        console.log(`🧪 Testing ${buttonName} button click...`);
        targetBtn.click();
      } else {
        console.log(`❌ ${buttonName} button not found or disabled`);
      }
    }, 100);
  };

  if (!isVisible || import.meta.env.VITE_SKIP_AUTH === 'false') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">🧪 Dashboard Button Tester</h3>

      <div className="space-y-2 mb-3">
        <button
          onClick={runQuickTest}
          className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Run Quick Test
        </button>

        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => testButtonClick('generate')}
            className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            Test Generate
          </button>
          <button
            onClick={() => testButtonClick('approval')}
            className="bg-teal-600 hover:bg-teal-700 px-2 py-1 rounded text-xs"
          >
            Test Approval
          </button>
          <button
            onClick={() => testButtonClick('word')}
            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
          >
            Test Word
          </button>
          <button
            onClick={() => testButtonClick('pdf')}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
          >
            Test PDF
          </button>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-1">
          <div className="font-semibold">Test Results:</div>
          {testResults.map((result, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={
                  result.status === 'pass'
                    ? 'text-green-400'
                    : result.status === 'warn'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }
              >
                {result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'}
              </span>
              <span className="truncate">{result.test}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-gray-400">Open DevTools Console for detailed logs</div>
    </div>
  );
}
