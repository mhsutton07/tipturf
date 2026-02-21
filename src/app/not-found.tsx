
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <a href="/" className="text-green-400 hover:text-green-300 text-sm">
          Go to Map
        </a>
      </div>
    </div>
  );
}
