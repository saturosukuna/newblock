// App.js
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Web3 from 'web3';
import Admin from './Admin';
import Student from './Student';
import Employer from './Employer';
import Home from './Home';
import About from './About';
import AcademicCredential from './AcademicCredential.json';
import './App.css';

const web3 = new Web3(window.ethereum);

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) setAccount(accounts[0]);

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = AcademicCredential.networks[networkId];

        if (deployedNetwork) {
          const contractInstance = new web3.eth.Contract(
            AcademicCredential.abi,
            deployedNetwork.address
          );
          setContract(contractInstance);
          if (accounts[0]) checkRole(contractInstance, accounts[0]);
        }

        window.ethereum.on('accountsChanged', (accounts) => {
          setAccount(accounts[0] || null);
          if (accounts[0] && contract) checkRole(contract, accounts[0]);
        });

      } catch (error) {
        console.error("Initialization error:", error);
      }
    }
    init();
  }, []);

  const checkRole = async (contractInstance, address) => {
    try {
      const isAdmin = await contractInstance.methods.isAdmin(address).call();
      const isStudent = await contractInstance.methods.isStudent(address).call();
      setRole(isAdmin ? 'admin' : isStudent ? 'student' : 'employer');
    } catch (error) {
      console.error("Role check error:", error);
      setRole('employer');
    }
  };

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
      if (contract) checkRole(contract, accounts[0]);
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <nav className="nav-container">
            <div className="nav-left">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/about" className="nav-link">About</Link>
            </div>
            <div className="nav-right">
              {account ? (
                <div className="account-info">
                  <span className="account-address">
                    {account.slice(0,6)}...{account.slice(-4)}
                  </span>
                  <Link to={role}><span className="account-role">({role})</span></Link>
                </div>
              ) : (
                <button className="connect-button" onClick={connectWallet}>
                  Connect Wallet
                </button>
              )}
            </div>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            {account && (
              <>
                {role === 'admin' && <Route path="/admin" element={<Admin contract={contract} account={account} />} />}
                {role === 'student' && <Route path="/student" element={<Student contract={contract} account={account} />} />}
                {role === 'employer' && <Route path="/employer" element={<Employer contract={contract} account={account} />} />}
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;