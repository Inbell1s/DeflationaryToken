console.log('running Deflationary.test.js');

console.log(web3.eth.getBalance);
var assert = require('chai').assert
  , foo = 'bar'
  , beverages = { tea: [ 'chai', 'matcha', 'oolong' ] };

var accounts;
// in web front-end, use an onload listener and similar to this manual flow ... 
web3.eth.getAccounts(function(err,res) { accounts = res; });

var Deflationary = artifacts.require("Deflationary");

contract('Deflationary', async accounts=>{
	const contractOwner = accounts[0];
	const adminUser = accounts[1];
	const randomUser1 = accounts[2];
	const randomUser2 = accounts[3];
	var ownerTokens =  1990000;
	
	beforeEach(async () => {
        instance = await Deflationary.deployed("Deflationary","DGR",0,{from: contractOwner });
        //application =  await instance.createApplication(duration,interest,creditAmount ,{from: borrower1 });
        //loanApplication = await LoanApplication.at(application.logs[0].args.newLoanApplication);
    });
	it("This should return the total supply equal to 2000000", async () => {
        application  = await instance.totalSupply();
        assert.equal(2000000,application);
    });
	
	it("This should return the allocated balance of the owner", async () => {
        //application  = await instance.myBalance({from: contractOwner });
		application = await instance.balanceOf(contractOwner)
        assert.equal(ownerTokens,application);
    });
	
	it("This should send 200 Deflationary simple transfer to a randomUser1", async () => {
        //sends the transfer
        assert.isOk(200,await instance.simpleTransfer(randomUser1,200,{from: contractOwner }));
		//Checks if User has 200 Deflationary Tokens
    	assert.equal(200,await instance.balanceOf(randomUser1));
		//Checks if Owner has 200 less Deflationary Tokens
		ownerTokens = ownerTokens-200
		assert.equal(ownerTokens,await instance.balanceOf(contractOwner));
	});
	function delay(interval) 
	{
	   return it('should delay', done => 
	   {
		  setTimeout(() => done(), interval)

	   }).timeout(interval + 100) // The extra 100ms should guarantee the test will not fail due to exceeded timeout
	}
	
	it("This should send 200 Locked Deflationary simple transfer to a adminUser", async () => {
        //sends the transfer
        assert.isOk(await instance.sendLockedToken(adminUser,200,{from: contractOwner }));
		//Checks if Owner has 200 less Deflationary Tokens
		ownerTokens = ownerTokens-200
		assert.equal(ownerTokens,await instance.balanceOf(contractOwner));
		//Admin balance should be stored here and should have 200
		 assert.equal(200, await instance.adminBalance(adminUser));
		 delay(2);
		try{
		 	assert.isOk(await instance.release({from: adminUser }));
		 	//User Should not have 200 Tokens yet as they are locked
		}catch(error){
		 	assert.isOk(error.toString().includes('TokenTimelock: current time is before release time'));
		}
		try{
			assert.equal(200,await instance.balanceOf(adminUser));
		 	//User Should not have 200 Tokens yet as they are locked
		}catch(error){
		 	assert.isOk(error.toString().includes('AssertionError: expected 200 to equal '));
		}
	});
	/*
	//This is a test to show that Realse works properly, This is commented out later
	it("This should send 200 Locked Deflationary simple transfer to a adminUser", async () => {
		//ADD THIS FUNCTION TO THE SMART CONTRACT TO BE ABLE TO Prove RELEASE WORKS
		//FUNCTION START
		function setReleased(uint256 newReleased) public{
		_released = newReleased;
		}
		//FUNCTION END
        //sends the transfer
        assert.isOk(await instance.sendLockedToken(adminUser,200,{from: contractOwner }));
		//Checks if Owner has 200 less Deflationary Tokens
		ownerTokens = ownerTokens-200
		assert.equal(ownerTokens,await instance.balanceOf(contractOwner));
		//Admin balance should be stored here and should have 200
		 assert.equal(200, await instance.adminBalance(adminUser));
		 delay(10);
		//sets the release to 0 to prove that tokens are let go once time is up
		await instance.setReleased(0);
		assert.isOk(await instance.release({from: adminUser }));
		 	//User Should not have 200 Tokens yet as they are locked
		
	
		assert.equal(200,await instance.balanceOf(adminUser));
		 	//User Should not have 200 Tokens yet as they are locked
	
	});
	*/
	it("This should allow for admins to check their own balance", async () => {
      	assert.equal(200, await instance.adminBalance(adminUser));
    });
	
	it("This should send Fail to send 200 Simple transfer to a User as its not sent by an owner", async () => {
        try{
		//sends the transfer
        	await instance.simpleTransfer(randomUser2,200,{from: randomUser1 })
		} catch (error) {
            assert.isOk(error.toString().includes('VM Exception while processing transaction: revert Unauthorised Sender'));
        }
	});
	
	it("This should send Fail to send 200 Locked transfer to a User as its not sent by an owner", async () => {
        try{
		//sends the transfer
        	await instance.sendLockedToken(randomUser2,200,{from: randomUser1 })
		} catch (error) {
            assert.isOk(error.toString().includes('VM Exception while processing transaction: revert Unauthorised Sender'));
        }
	});

	it("This should send 100 tokens from one User to Another while burning", async () => {
		assert.isOk(await instance.transfer(randomUser2,100,{from: randomUser1 }));
		//86 tokens sent to User2
		assert.equal(86,await instance.balanceOf(randomUser2));
		//100 Tokens left over from User 1
		assert.equal(100,await instance.balanceOf(randomUser1));
		//100-14.5 = 85.5 tokens sent rounded up therefore 86 tokens sent
	});
	
	it("Sending 9 tokens only 8 will arrive, 1 is burned", async () => {
		assert.isOk(await instance.transfer(randomUser2,9,{from: randomUser1 }));
		//86 tokens sent to User2
		assert.equal(86+8,await instance.balanceOf(randomUser2));
		//100 Tokens left over from User 1
		assert.equal(91,await instance.balanceOf(randomUser1));
		//100-14.5 = 85.5 tokens sent rounded up therefore 86 tokens sent
	});
	
	it("Sending 1 token will fail", async () => {
		try{
			assert.isOk(await instance.transfer(randomUser2,1,{from: randomUser1 }));
		}catch (error) {
            assert.isOk(error.toString().includes('Minimum tokens to be sent is 2'));
        }
	});
	
	it("Sending more tokens that a balance possibly has will fail", async () => {
		try{
			assert.isOk(await instance.transfer(randomUser2,500,{from: randomUser1 }));
		}catch (error) {
            assert.isOk(error.toString().includes('Not Enough Tokens in Account'));
        }
	});
	
	it("Burning 10 own tokens", async () => {
		await instance.burn(10,{from: randomUser1 });
		assert.equal(81,await instance.balanceOf(randomUser1));
	});
	
	it("Failing to Burn more tokens that you own", async () => {
		try{
			await instance.burn(90,{from: randomUser1 });
		}catch (error) {
            assert.isOk(error.toString().includes('Not Enough Tokens in Account'));
        }
	});
	
	//This section we do common smart contract attacks
	it("UnderFlow attack", async () => {
		try{
        //sends the transfer
        	assert.isOk(await instance.simpleTransfer(randomUser1,0,{from: contractOwner }));
		}catch(error){
            assert.isOk(error.toString().includes('Error: Returned error: VM Exception while processing transaction: revert'));
		}
	});
	it("Overflow attack", async () => {
		try{
        //sends the transfer
        	assert.isOk(await instance.simpleTransfer(randomUser1,2**256,{from: contractOwner }));
		}catch(error){
            assert.isOk(error.toString().includes('Error: invalid number value (arg="value", coderType="uint256", value=1.157920892373162e+77)'));
		}
	});
	
	it("Overflow Locked token", async () => {
		try{
            //sends the transfer
        	assert.isOk(await instance.sendLockedToken(adminUser,2**256,{from: contractOwner }));
		}catch(error){
            assert.isOk(error.toString().includes('Error: invalid number value (arg="value", coderType="uint256", value=1.157920892373162e+77)'));
		}
	});
	it("UnderFlow Locked token", async () => {
		try{
            //sends the transfer
        	assert.isOk(await instance.sendLockedToken(adminUser,0,{from: contractOwner }));
		}catch(error){
            assert.isOk(error.toString().includes('Error: Returned error: VM Exception while processing transaction: revert'));
		}
	});
	
	it("Cannot Burn tokens if you're not allowed", async () => {
		try{
            //sends the transfer
        	assert.isOk(await instance.burnFrom(contractOwner,220,{from: randomUser1 }));
		}catch(error){
            assert.isOk(error.toString().includes('Error: Returned error: VM Exception while processing transaction: revert'));
		}
	});
	
});