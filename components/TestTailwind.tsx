/**
 * Test component to verify Tailwind CSS is working correctly.
 * 
 * This component uses various Tailwind utility classes to ensure
 * the CSS framework is properly configured and styles are applied.
 * 
 * @component
 */
export default function TestTailwind() {
  return (
    <div className="p-4 bg-blue-500 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2">Tailwind CSS Test</h2>
      <p className="text-sm opacity-90">
        If you can see this styled component, Tailwind CSS is working correctly!
      </p>
      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100 transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
}

