console.log('running BURNT.test.js');

console.log(web3.eth.getBalance);
var assert = require('chai').assert
  , foo = 'bar'
  , beverages = { tea: [ 'chai', 'matcha', 'oolong' ] };

var accounts;
// in web front-end, use an onload listener and similar to this manual flow ... 
web3.eth.getAccounts(function(err,res) { accounts = res; });

var BURNT = artifacts.require("BURNT");

contract('BURNT', async accounts=>{
	const contractOwner = accounts[0];
	const adminUser = accounts[1];
	const randomUser1 = accounts[2];
	const randomUser2 = accounts[3];
	var ownerTokens =  1990000;
	
	beforeEach(async () => {
        instance = await BURNT.deployed("BurnToken","BURNT",0,{from: contractOwner });
        //application =  await instance.createApplication(duration,interest,creditAmount ,{from: borrower1 });
        //loanApplication = await LoanApplication.at(application.logs[0].args.newLoanApplication);
    });
	it("This should return the total supply equal to 2000000", async () => {
        application  = await instance.totalSupply();
        assert.equal(2000000,application);
    });
	
	it("This should return the allocated balance of the owner", async () => {
        application  = await instance.myBalance({from: contractOwner });
        assert.equal(ownerTokens,application);
    });
	
	it("This should send 200 Burnt simple transfer to a randomUser1", async () => {
        //sends the transfer
        assert.isOk(200,await instance.simpleTransfer(randomUser1,200,{from: contractOwner }));
		//Checks if User has 200 BURNT Tokens
    	assert.equal(200,await instance.balanceOf(randomUser1));
		//Checks if Owner has 200 less Burnt Tokens
		ownerTokens = ownerTokens-200
		assert.equal(ownerTokens,await instance.balanceOf(contractOwner));
	});
	
	it("This should send 200 Locked Burnt simple transfer to a adminUser", async () => {
        //sends the transfer
        assert.isOk(await instance.sendLockedToken(adminUser,200,{from: contractOwner }));
		//Checks if Owner has 200 less Burnt Tokens
		ownerTokens = ownerTokens-200
		assert.equal(ownerTokens,await instance.balanceOf(contractOwner));
		//User Should not have 200 Tokens yet as they are locked
    	 assert.notEqual(200,await instance.balanceOf(adminUser));
		//Admin balance should be stored here and should have 200
		 assert.equal(200, await instance.adminBalance(adminUser));
	});
	
	it("This should allow for admins to check their own balance", async () => {
      	assert.equal(200, await instance.myAdminBalance({from: adminUser }));
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
	
});