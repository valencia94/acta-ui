import { useEffect } from 'react';
export default function RuntimeLog() {
  useEffect(() => {
    console.log("\ud83c\udf0d Runtime log injected at:", new Date().toISOString());
  }, []);
  return null;
}
