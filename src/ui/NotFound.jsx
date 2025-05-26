import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 p-4 flex items-center justify-center transition-colors">
      <div className="max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg transition-colors">
        <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/"
            className="px-5 py-2 bg-accent-600 text-white rounded hover:bg-accent-700 transition-colors"
          >
            Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
