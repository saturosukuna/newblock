import { useState, useEffect } from 'react';
import { retrieveDataFromIPFS } from "./utils/ipfs";

import React from 'react';

const Employer = ({ contract, account }) => {
  const [students, setStudents] = useState([]);
  const [searchRollNo, setSearchRollNo] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [requestStatus, setRequestStatus] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const result = await contract.methods.getAllStudents().call();
        const formattedStudents = result[0].map((rollNo, index) => ({
          rollNo,
          email: result[1][index],
          id: `${rollNo}-${index}`
        }));
        setStudents(formattedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    
    fetchStudents();
  }, [contract.methods]);

  const handleRequest = async (email, studentId) => {
    setLoading(true);
    setRequestStatus(prev => ({ ...prev, [studentId]: 'sending' }));
    
    try {
      const content = {
        subject: `Data Access Request from ${account.slice(0, 6)}...`,
        body: `Dear user,\n\nAccount ${account} is requesting access to your verified data. And Give accept after you authorize permission to them`
      };

      const response = await fetch('http://localhost:3001/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: email,
          subject: content.subject,
          text: content.body,
        }),
      });

      if (!response.ok) throw new Error('Request failed');
      
      setRequestStatus(prev => ({ ...prev, [studentId]: 'sent' }));
      setTimeout(() => {
        setRequestStatus(prev => ({ ...prev, [studentId]: null }));
      }, 3000);
    } catch (error) {
      console.error('Error sending request:', error);
      setRequestStatus(prev => ({ ...prev, [studentId]: 'failed' }));
      setTimeout(() => {
        setRequestStatus(prev => ({ ...prev, [studentId]: null }));
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudent = async () => {
    try {
      const student = await contract.methods
        .getStudentDataByRollNo(searchRollNo)
        .call({ from: account });

      if (student.wallet === "0x0000000000000000000000000000000000000000") {
        alert("No student found with this roll number.");
        return;
      }

      const [ipfsHash, docHash] = await Promise.all([
        retrieveDataFromIPFS(student.ipfsHash),
        retrieveDataFromIPFS(student.docHash)
      ]);

      setStudentData(ipfsHash || {});
      setDocumentData(docHash || {});
    } catch (error) {
      console.error("Error fetching student data:", error);
      alert("Failed to fetch student details.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Employer Panel</h1>

      {/* Students List Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Registered Students</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">Roll Number</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="border p-3">{student.rollNo}</td>
                  <td className="border p-3">{student.email}</td>
                  <td className="border p-3 text-center">
                    <button
                      onClick={() => handleRequest(student.email, student.id)}
                      disabled={loading || requestStatus[student.id]}
                      className={`px-4 py-2 rounded ${
                        requestStatus[student.id] === 'sent' 
                          ? 'bg-green-500 text-white'
                          : requestStatus[student.id] === 'sending'
                          ? 'bg-blue-500 text-white cursor-wait'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {requestStatus[student.id] === 'sent' ? '✓ Sent' : 
                       requestStatus[student.id] === 'sending' ? 'Sending...' : 
                       'Request Verification'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Search Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Student Search</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Enter Roll Number"
            value={searchRollNo}
            onChange={(e) => setSearchRollNo(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={fetchStudent}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Search
          </button>
        </div>

        {/* Student Info Display */}
        {studentData && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Student Information</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(studentData).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{key}:</span>
                  <span>{value || 'N/A'}</span>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-4">Documents</h3>
            <div className="grid gap-4">
              {documentData && Object.entries(documentData).map(([key, value]) => (
                <div key={key} className="border p-4 rounded">
                  <div className="flex justify-between mb-3">
                    <span className="font-medium">{key}:</span>
                    <span>{value ? "✓ Uploaded" : "Not Provided"}</span>
                  </div>
                  {value && (
                    <>
                      <iframe
                        src={`data:application/pdf;base64,${value}`}
                        className="w-full h-64 mb-3"
                        title={`${key} document`}
                      />
                      <button
                        onClick={() => downloadPDF(value)}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                      >
                        Download PDF
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Employer;

