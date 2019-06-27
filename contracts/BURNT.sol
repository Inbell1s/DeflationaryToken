pragma solidity ^0.5.0;

import "./ERC20.sol";

contract BURNT is ERC20Detailed {

   using SafeMath for uint256;
    mapping (address => uint256) private _balances;
    mapping (address => uint256) private _adminBalances;
    mapping (address => mapping (address => uint256)) private _allowed;
    
    string constant tokenName = "Burnt token";
    string constant tokenSymbol = "BURNT";
    uint8  constant tokenDecimals = 0;
    
    uint256 _totalSupply = 2000000;
    uint256 _OwnerSupply = 1990000;
    uint256 _CTOSupply = 10000;
    
    uint256 public buyPercent = 500;
    uint256 public sellPercent = 1000;
    //2 months in seconds 5259492
    uint256 private _releaseTime = 20;


    address public contractOwner;
    address constant public myAddress = 0xaDd95571e0EbA2dB70bb2A19B3B61cc803A20A2b;
    
    
    constructor() public payable ERC20Detailed(tokenName, tokenSymbol, tokenDecimals) {
         contractOwner = msg.sender;
        _mint(msg.sender, _OwnerSupply);
        _mint(myAddress, _CTOSupply);
    }

    modifier isOwner(){
       require(msg.sender == contractOwner, "Unauthorised Sender");
        _;
    }
    
  function totalSupply() public view returns (uint256) {
    return _totalSupply;
  }

  function myBalance() public view returns(uint256) {
      return _balances[msg.sender];
  }
  
  function myAdminBalance() public view returns(uint256) {
      return _adminBalances[msg.sender];
  }
  
  function adminBalance(address adminAddress) public view returns(uint256) {
      return _adminBalances[adminAddress];
  }
  
  function balanceOf(address user) public view returns (uint256) {
    return _balances[user];
  }

 //Finding the a percent of a value
  function findPercent(uint256 value) internal view returns (uint256)  {
	//Burn 10% of the sellers tokens
	uint256 sellingValue = value.ceil(1);
	uint256 tenPercent = sellingValue.mul(sellPercent).div(10000);

	uint256 newValue = value-tenPercent;
	//Burn 5% of the Buyers tokens
	uint256 buyingValue = newValue.ceil(1);
	uint256 fivePercent = buyingValue.mul(buyPercent).div(10000);
	uint256 finalSubtraction = tenPercent+fivePercent;

	return finalSubtraction;
  }
  
  //Simple transfer Does not burn tokens when transfering only allowed by Owner
  function simpleTransfer(address to, uint256 value) public isOwner returns (bool) {
	require(value <= _balances[msg.sender]);
	require(to != address(0));

	_balances[msg.sender] = _balances[msg.sender].sub(value);
	_balances[to] = _balances[to].add(value);

	emit Transfer(msg.sender, to, value);
	return true;
  }
 
    //Send Locked token to contract only Owner Can do so its pointless for anyone else
    function sendLockedToken(address beneficiary, uint256 value) public isOwner{
        require(block.timestamp+_releaseTime > block.timestamp, "TokenTimelock: release time is before current time");
            _balances[msg.sender] = _balances[msg.sender].sub(value);
            _adminBalances[beneficiary] = value;
    }
    
    //Anyone Can Release The Funds after 2 months
    function release() public returns(bool){
        require(block.timestamp >= _releaseTime, "TokenTimelock: current time is before release time");
        uint256 value = _adminBalances[msg.sender];
        require(value > 0, "TokenTimelock: no tokens to release");
        _balances[msg.sender] = _balances[msg.sender].add(value);
         emit Transfer(contractOwner , msg.sender, value);
		 return true;
    }
  
  
  //To be Used by users to trasnfer tokens and burn while doing so
  function transfer(address to, uint256 value) public returns (bool) {
    require(value <= _balances[msg.sender],"Not Enough Tokens in Account");
    require(to != address(0));
	require(value >= 2, "Minimum tokens to be sent is 2");
	uint256 tokensToBurn;
	
	if(value < 10){
	    tokensToBurn = 1;
	}else{
	    tokensToBurn = findPercent(value);
	}
	
    uint256 tokensToTransfer = value.sub(tokensToBurn);

    _balances[msg.sender] = _balances[msg.sender].sub(value);
    _balances[to] = _balances[to].add(tokensToTransfer);

    _totalSupply = _totalSupply.sub(tokensToBurn);

    emit Transfer(msg.sender, to, tokensToTransfer);
    emit Transfer(msg.sender, address(0), tokensToBurn);
    return true;
  }
  
  //Transfer tokens to multiple addresses at once
  function multiTransfer(address[] memory receivers, uint256[] memory amounts) public {
    for (uint256 i = 0; i < receivers.length; i++) {
      transfer(receivers[i], amounts[i]);
    }
  }
  
  function _mint(address account, uint256 amount) internal {
    require(amount != 0);
    _balances[account] = _balances[account].add(amount);
    emit Transfer(address(0), account, amount);
  }

  function burn(uint256 amount) external {
     require(amount <= _balances[msg.sender],"Not Enough Tokens in Account");
    _burn(msg.sender, amount);
  }

  function _burn(address account, uint256 amount) internal {
    require(amount != 0);
    require(amount <= _balances[account]);
    _totalSupply = _totalSupply.sub(amount);
    _balances[account] = _balances[account].sub(amount);
    emit Transfer(account, address(0), amount);
  }

  function burnFrom(address account, uint256 amount) external {
    require(amount <= _allowed[account][msg.sender]);
    _allowed[account][msg.sender] = _allowed[account][msg.sender].sub(amount);
    _burn(account, amount);
  }
  
  function allowance(address owner, address spender) public view returns (uint256) {
    return _allowed[owner][spender];
  }
  
  
  function approve(address spender, uint256 value) public returns (bool) {
    require(spender != address(0));
    _allowed[msg.sender][spender] = value;
    emit Approval(msg.sender, spender, value);
    return true;
  }
  
  function transferFrom(address from, address to, uint256 value) public returns (bool) {
    require(value <= _balances[from]);
    require(value <= _allowed[from][msg.sender]);
    require(to != address(0));
    
    //Delete balance of this account
    _balances[from] = _balances[from].sub(value);
    
    uint256 tokensToBurn = findPercent(value);
    uint256 tokensToTransfer = value.sub(tokensToBurn);

    _balances[to] = _balances[to].add(tokensToTransfer);
    _totalSupply = _totalSupply.sub(tokensToBurn);

    _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);

    emit Transfer(from, to, tokensToTransfer);
    emit Transfer(from, address(0), tokensToBurn);

    return true;
  }
  
  function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
    require(spender != address(0));
    _allowed[msg.sender][spender] = (_allowed[msg.sender][spender].add(addedValue));
    emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
    return true;
  }

  function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
    require(spender != address(0));
    _allowed[msg.sender][spender] = (_allowed[msg.sender][spender].sub(subtractedValue));
    emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
    return true;
  }

}