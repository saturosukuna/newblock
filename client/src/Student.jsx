import { useState, useEffect } from 'react';
import { storeDataInIPFS,retrieveDataFromIPFS } from "./utils/ipfs";
import React from 'react';



const Student = ({ contract, account }) => {
  const [studentData, setStudentData] = useState(null);
  const [authAddress, setAuthAddress] = useState('');
  const [authorizedList, setAuthorizedList] = useState([]);
  const [Student, setStudent] = useState('');
  const [StdDoc, setStdDoc] = useState('');
  useEffect(() => {
    async function loadData() {
      try {
        const student = await contract.methods.getStudent(account).call({from:account});
        
        const auths = await contract.methods.getAuthorizedEmployers(account).call({from:account});
        setAuthorizedList(auths);
        if (student.wallet !== "0x0000000000000000000000000000000000000000") {
          const ipfsHash = await retrieveDataFromIPFS(student.ipfsHash);
          const docHash = await retrieveDataFromIPFS(student.docHash);
  
          setStudent(ipfsHash || {});
          setStdDoc(docHash || {});
          
  
        } else {
          alert("No student found with this roll number.");
        }
      } catch (error) {
        console.error("Data load error:", error);
      }
    }
    loadData();
  }, [contract, account]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await contract.methods.updateStudentData(
        studentData.ipfsHash,
        studentData.docHash,
        studentData.rollNo
      ).send({ from: account });
      alert('Data updated successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };
  const downloadPDF = (base64Data, filename = "document.pdf") => {
    // Convert base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Cleanup
    document.body.removeChild(link);
  };


  const handleAuthorization = async () => {
    try {
      await contract.methods.authorize(authAddress).send({ from: account });
      setAuthorizedList([...authorizedList, authAddress]);
      setAuthAddress('');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleRevoke = async (address) => {
    try {
      await contract.methods.revoke(address).send({ from: account });
      setAuthorizedList(authorizedList.filter(addr => addr !== address));
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="panel">
      <h2>Student Panel</h2>
      
      {Student && (
          <div className="student-info">
            <div className="info-grid">
              {Object.entries(Student).map(([key, value]) => (
                <div key={key} className="info-item">
                  <strong>{key.replace(/([A-Z])/g, ' $1')}:</strong>
                  <span>{value || 'N/A'}</span>
                </div>
              ))}
            </div>

            <h2 className="document-title">Documents</h2>
            <div className="document-display-grid">
              {Object.entries(StdDoc).map(([key, value]) => (
                <div key={key} className="document-item">
                  <div className="document-header">
                    <strong>{key.replace(/([A-Z])/g, ' $1')}:</strong>
                    <span>{value ? "Uploaded" : "Not Provided"}</span>
                  </div>
                  <iframe
                    src={`data:application/pdf;base64,${value}`}
                    className="document-iframe"
                  ></iframe>
                  <button onClick={() => downloadPDF(value)} className="btn btn-download">
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
      
      )}

      <section>
        <h3>Manage Authorizations</h3>
        <div>
          <input type="text" 
            placeholder="Employer Address" 
            value={authAddress}
            onChange={e => setAuthAddress(e.target.value)}
          />
          <button onClick={handleAuthorization}>Authorize</button>
        </div>
        
        <div>
          <h4>Authorized Employers:</h4>
          {authorizedList.map((address, index) => (
            <div key={index} className="auth-item">
              <span>{address}</span>
              <button onClick={() => handleRevoke(address)}>Revoke</button>
            </div>
          ))}
        </div>
      </section>
      

    </div>
  );
}
export default Student;