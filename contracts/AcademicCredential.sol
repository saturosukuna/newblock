// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract AcademicCredential {
    
    struct Student {
        address wallet;
        string ipfsHash;
        string docHash;
        string rollNo;
        string contact;
    }
    
    mapping(address => Student) public students;
    mapping(string => address) private studentByRollNo;
    mapping(address => address[]) private authorizedEmployers;
    mapping(address => mapping(address => bool)) private isAuthorized;
    address[] private studentAddresses;
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlySelfOrAdmin(address wallet) {
        require(
            msg.sender == admin || msg.sender == wallet,
            "Only admin or the owner of this data can perform this action"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addStudent(
        address wallet,
        string memory ipfsHash,
        string memory docHash,
        string memory rollNo,
        string memory contact
    ) public onlyAdmin {
        require(bytes(students[wallet].ipfsHash).length == 0, "Student already exists.");
        require(studentByRollNo[rollNo] == address(0), "Roll number already in use.");
        students[wallet] = Student(wallet, ipfsHash, docHash, rollNo, contact);
        studentByRollNo[rollNo] = wallet;
        studentAddresses.push(wallet); 
    }

    function updateStudentData(
        string memory newIpfsHash,
        string memory newDocHash,
        string memory newRollNo,
        string memory newContact
    ) public {
        require(isStudent(msg.sender), "Caller is not a student");
        address studentAddress = msg.sender;

        // Ensure new roll number is not already taken
        require(
            keccak256(abi.encodePacked(students[studentAddress].rollNo)) == keccak256(abi.encodePacked(newRollNo)) ||
            studentByRollNo[newRollNo] == address(0),
            "Roll number already in use"
        );

        // Remove old roll number mapping if changed
        if (keccak256(abi.encodePacked(students[studentAddress].rollNo)) != keccak256(abi.encodePacked(newRollNo))) {
            delete studentByRollNo[students[studentAddress].rollNo];
            studentByRollNo[newRollNo] = studentAddress;
        }

        // Update student data
        students[studentAddress].ipfsHash = newIpfsHash;
        students[studentAddress].docHash = newDocHash;
        students[studentAddress].rollNo = newRollNo;
        students[studentAddress].contact = newContact;
    }

    function getStudentByRollNo(string memory rollNo) public view onlyAdmin returns (Student memory) {
        address studentAddress = studentByRollNo[rollNo];
        require(studentAddress != address(0), "Student not found");
        return students[studentAddress];
    }

    function getStudent(address wallet) public view onlySelfOrAdmin(wallet) returns (Student memory) {
        return students[wallet];
    }

    function authorize(address employer) public {
        require(isStudent(msg.sender), "Caller is not a student");
        require(!isAuthorized[msg.sender][employer], "Already authorized");
        
        authorizedEmployers[msg.sender].push(employer);
        isAuthorized[msg.sender][employer] = true;
    }

    function revoke(address employer) public {
        require(isStudent(msg.sender), "Caller is not a student");
        
        isAuthorized[msg.sender][employer] = false;
        
        address[] storage employers = authorizedEmployers[msg.sender];
        for (uint i = 0; i < employers.length; i++) {
            if (employers[i] == employer) {
                employers[i] = employers[employers.length - 1];
                employers.pop();
                break;
            }
        }
    }

    function getAuthorizedEmployers(address student) public view returns (address[] memory) {
        require(msg.sender == student || msg.sender == admin, "Not authorized");
        return authorizedEmployers[student];
    }

    function getStudentDataByRollNo(string memory rollNo) public view returns (Student memory) {
        address studentAddress = studentByRollNo[rollNo];
        require(studentAddress != address(0), "Student not found");
        require(
            isAuthorized[studentAddress][msg.sender] || msg.sender == admin,
            "Not authorized"
        );
        return students[studentAddress];
    }

    function isAdmin(address wallet) public view returns (bool) {
        return wallet == admin;
    }

    function isStudent(address wallet) public view returns (bool) {
        return bytes(students[wallet].ipfsHash).length > 0;
    }


function getAllStudents() public view returns (string[] memory, string[] memory) {
    uint count = studentAddresses.length;
    string[] memory rollNos = new string[](count);
    string[] memory contacts = new string[](count);

    for (uint i = 0; i < count; i++) {
        Student storage student = students[studentAddresses[i]];
        rollNos[i] = student.rollNo;
        contacts[i] = student.contact;
    }

    return (rollNos, contacts);
}
}