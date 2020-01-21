var Deflationary = artifacts.require('Deflationary');

module.exports = function(deployer) {
	deployer.deploy(Deflationary)
  // Use deployer to state migration tasks.
};
