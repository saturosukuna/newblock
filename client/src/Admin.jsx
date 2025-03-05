
import './Admin.css';
import React, { useState } from "react";
import { storeDataInIPFS,retrieveDataFromIPFS } from "./utils/ipfs";

const Admin = ({ contract, account }) => {
  // Student information state
  const [studentInfo, setStudentInfo] = useState({
    wallet: "",
    name: "",
    rollNo: "",
    class: "",
    school: "",
    yearOfStudy: "",
    major: "",
    department: "",
    dob: "",
    address: "",
    contact: "",
    email: "",
    fatherName: "",
    motherName: "",
    fatherOcc: "",
    motherOcc: "",
    parentContact: "",
    admissionDate: "",
    previousSchool: "",
    percentage: "",
    hostelRequired: "",
    scholarship: "",
    remarks: "",
  });

  // Student documents state
  const [documents, setDocuments] = useState({
    photo: null,
    aadhar: null,
    tenthCert: null,
    twelfthCert: null,
    tc: null,
    income: null,
    community: null,
    native: null,
  });
  const [Student,setStudent] =useState('');
  const [StdDoc,setStdDoc] =useState('');
  const [searchRollNo, setSearchRollNo] = useState('');
  const [show,setshow]=useState(false);


 
  const fetchStudent = async () => {
    try {
        const student = await contract.methods.getStudentByRollNo(searchRollNo).call({ from: account });
        if (student.wallet !== "0x0000000000000000000000000000000000000000") {
            const ipfsHash = await retrieveDataFromIPFS(student.ipfsHash);
            const docHash = await retrieveDataFromIPFS(student.docHash);

            setStudent(ipfsHash || {});
            setStdDoc(docHash || {});
            setshow(true);
          

        } else {
            alert("No student found with this roll number.");
        }
    } catch (error) {
        console.error("Error fetching student data:", error);
        alert("Failed to fetch student details.");
    }
};
  // Determine input type dynamically
  const getInputType = (key) => {
    if (key === "contact" || key === "parentContact") return "tel";
    if (key === "email") return "email";
    if (key === "dob" || key === "admissionDate") return "date";
    if (key === "rollNo" || key === "yearOfStudy") return "number";
    if (key === "percentage") return "number";
    if (key === "hostelRequired" || key === "scholarship" || key === "remarks") return "checkbox";
    return "text"; // Default to text
  };



  const getInputClass = (type) => {
    switch (type) {
      case "email":
        return "input input-email";
      case "tel":
        return "input input-tel";
      case "date":
        return "input input-date";
      case "number":
        return "input input-number";
      case "checkbox":
        return "input-checkbox";
      default:
        return "border px-2 py-1 rounded focus:border-gray-500";
    }
  };

  // Handle input changes
  const handleInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStudentInfo((prevInfo) => ({
      ...prevInfo,
      [name]: type === "checkbox"
        ? name === "hostelRequired" // For hostelRequired
          ? checked ? "Hostel" : "DayScholar"
          : name === "scholarship" // For scholarship
            ? checked ? "Yes" : "No"
            : name === "remarks" // For hostelRequired
              ? checked ? "bad" : "good"
              : checked // For other checkboxes, default to yes/no
        : value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    // Check if the file exists
    if (file) {
      const reader = new FileReader();

      // When the file is read successfully
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]; // Extract the base64 string

        // Update the state with the base64 string
        setDocuments((prev) => ({
          ...prev,
          [name]: base64, // Store the base64 string in the state
        }));
      };

      // Read the file as a data URL (base64)
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Student Info:", studentInfo);
    console.log("Uploaded Documents:", documents);
    try {
      const ipfsHash = await storeDataInIPFS(studentInfo);
      const docHash = await storeDataInIPFS(documents);

      await contract.methods
        .addStudent(studentInfo.wallet, ipfsHash, docHash, studentInfo.rollNo,studentInfo.email)
        .send({ from: account });
      alert("Student added successfully!");
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Failed to add student.");
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

  // Document names mapping
  const documentNames = [
    { label: "Photo", name: "photo" },
    { label: "Aadhar", name: "aadhar" },
    { label: "10th Certificate", name: "tenthCert" },
    { label: "12th Certificate", name: "twelfthCert" },
    { label: "Transfer Certificate", name: "tc" },
    { label: "Income Certificate", name: "income" },
    { label: "Community Certificate", name: "community" },
    { label: "Native Certificate", name: "native" },
  ];

  return (
    <>
    <form onSubmit={handleSubmit} className="form-container">
  <h2 className="form-title">Student Information Form</h2>

  {/* Student Info Grid */}
  <div className="form-grid">
    {Object.keys(studentInfo).map((key) => (
      <div key={key} className="input-group">
        <label className="input-label">
          {key.replace(/([A-Z])/g, " $1").toUpperCase()}
        </label>
        <input
          type={getInputType(key)}
          name={key}
          value={typeof studentInfo[key] === "boolean" ? undefined : studentInfo[key]}
          checked={typeof studentInfo[key] === "boolean" ? studentInfo[key] : undefined}
          onChange={handleInfoChange}
          className={getInputClass}
        />
      </div>
    ))}
  </div>

  {/* Document Upload Section */}
  <div className="document-section">
    <h3 className="section-title">Upload Documents</h3>
    <div className="document-grid">
      {documentNames.map((doc) => (
        <div key={doc.name} className="upload-group">
          <label className="input-label">Upload {doc.label} (PDF)</label>
          <input
            type="file"
            name={doc.name}
            onChange={handleFileChange}
            accept=".pdf"
            className="file-input"
          />
          {documents[doc.name] && (
            <p className="file-name">{documents[doc.name].name}</p>
          )}
        </div>
      ))}
    </div>
  </div>

  {/* Form Actions */}
  <div className="form-actions">
    <button type="submit" className="btn btn-primary">
      Submit
    </button>
  </div>
  </form>
  {/* Search Section */}
  <div className="search-section">
    <h3 className="section-title">Search Student</h3>
    <div className="search-group">
      <input
        type="text"
        placeholder="Enter Roll Number"
        value={searchRollNo}
        onChange={e => setSearchRollNo(e.target.value)}
        className="search-input"
      />
      <button onClick={fetchStudent} className="btn">
        Search
      </button>
    </div>
  </div>

  {/* Student Info Display */}
  {show && (
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

</>
  );
};

export default Admin;

