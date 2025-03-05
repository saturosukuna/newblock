const AcademicCredential = artifacts.require("AcademicCredential");

module.exports = function (deployer) {
    

    // Deploy the contract with the parameters
    deployer.deploy(AcademicCredential);
};
