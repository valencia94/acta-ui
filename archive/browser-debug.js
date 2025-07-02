// Simple browser debug script using native fetch
async function debugDashboard() {
  console.log('🧪 Debugging dashboard issues...');

  try {
    // Check if the site is accessible
    const response = await fetch('https://d7t9x3j66yd8k.cloudfront.net/');
    console.log(`📍 Site response status: ${response.status}`);

    if (response.ok) {
      const html = await response.text();

      // Check for key elements
      const hasReactRoot = html.includes('id="root"');
      const hasJSBundle =
        html.includes('index-OeAFig3F.js') ||
        (html.includes('index-') && html.includes('.js'));
      const hasCSSBundle =
        html.includes('index-BAyJH397.css') ||
        (html.includes('index-') && html.includes('.css'));
      const hasTitle = html.includes('<title>');

      console.log('📋 HTML Analysis:');
      console.log(`⚛️ Has React root element: ${hasReactRoot}`);
      console.log(`📦 Has JS bundle: ${hasJSBundle}`);
      console.log(`🎨 Has CSS bundle: ${hasCSSBundle}`);
      console.log(`📰 Has title: ${hasTitle}`);

      // Check for environment variables in the JS
      const jsUrlMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
      if (jsUrlMatch) {
        console.log(`📦 JS Bundle URL: ${jsUrlMatch[1]}`);

        try {
          const jsResponse = await fetch(
            `https://d7t9x3j66yd8k.cloudfront.net${jsUrlMatch[1]}`
          );
          const jsContent = await jsResponse.text();

          // Look for environment variable patterns
          const hasViteEnv = jsContent.includes('import.meta.env');
          const hasProcessEnv = jsContent.includes('process.env');
          const hasAPIRef =
            jsContent.includes('api.') || jsContent.includes('API');

          console.log('📦 JS Bundle Analysis:');
          console.log(`🔧 Has Vite env: ${hasViteEnv}`);
          console.log(`🔧 Has process env: ${hasProcessEnv}`);
          console.log(`🌐 Has API references: ${hasAPIRef}`);

          // Look for specific patterns that might cause issues
          const issues = [];
          if (jsContent.includes('undefined')) {
            issues.push('Contains undefined references');
          }
          if (
            jsContent.includes('import.meta.env') &&
            !jsContent.includes('VITE_')
          ) {
            issues.push('Environment variables not properly replaced');
          }

          if (issues.length > 0) {
            console.log('⚠️ Potential issues found:');
            issues.forEach((issue) => console.log(`  - ${issue}`));
          } else {
            console.log('✅ No obvious issues in JS bundle');
          }
        } catch (jsError) {
          console.error('❌ Error loading JS bundle:', jsError.message);
        }
      }

      // Extract first 500 chars of body content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
      if (bodyMatch) {
        console.log('📄 Body content preview:');
        console.log(bodyMatch[1].substring(0, 500));
      }
    } else {
      console.error(
        `❌ Site not accessible: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugDashboard().catch(console.error);
