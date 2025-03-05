// Header.jsx
import { Link } from 'react-router-dom';

export default function Header({ role, connectWallet, connected }) {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/about" className="hover:text-gray-300">About</Link>
          {connected && <span className="ml-4 text-yellow-400">({role})</span>}
        </div>
        
        <button 
          onClick={connectWallet}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          {connected ? 'Connected ✅' : 'Connect Wallet'}
        </button>
      </div>
    </nav>
  );
}
