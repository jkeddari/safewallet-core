// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract SafeWallet is AccessControl {
    struct Transaction {
        address payable to;
        uint256 amount;
        uint confirmations;
        bool executed;
    }

    event NewTransaction(address indexed owner, uint indexed txIndex, address indexed to, uint amount);
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(uint indexed txIndex);

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

    address[] public s_owners;
    uint s_requiredConfirmation;    
    Transaction[] public s_transactions;
    mapping(uint => mapping(address => bool)) public isConfirmed;
    mapping(address => bool) public existOwner;


    modifier transactionExists(uint _txIndex) {
        require(_txIndex < s_transactions.length, "safewallet: transaction does not exist");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!s_transactions[_txIndex].executed, "safewallet: transaction already executed");
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "safewallet: transaction already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint _requiredConfirmation) {
        require(_owners.length > 0, "safewallet: owner required");
        require(_requiredConfirmation > 0 && _requiredConfirmation <= _owners.length, "safewallet: invalid required confirmations");

        for(uint i=0; i < _owners.length ; i++) {
            require(_owners[i] != address(0), "safewallet: invalid owner address");
            require(!existOwner[_owners[i]], "safewallet: owner must be unique");
            
            _grantRole(OWNER_ROLE, _owners[i]);
            existOwner[_owners[i]] = true;
            s_owners.push(_owners[i]);
        }

        s_requiredConfirmation = _requiredConfirmation;
    }

    receive() external payable {
        require(msg.value > 0, "safewallet: not enough funds deposited");
    }

    function newTransaction(address payable _to, uint256 _amount) external onlyRole(OWNER_ROLE) {
        uint transactionId = s_transactions.length;

        s_transactions.push(
            Transaction({
                to: _to,
                amount: _amount,
                executed: false,
                confirmations: 0
            })
        );

        emit NewTransaction(msg.sender, transactionId, _to, _amount);
    }

    function confirmTransaction(uint _txIndex) external onlyRole(OWNER_ROLE) transactionExists(_txIndex) notExecuted(_txIndex) notConfirmed(_txIndex) {
        s_transactions[_txIndex].confirmations++;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);

        if (s_transactions[_txIndex].confirmations >= s_requiredConfirmation) {
            _executeTransaction(_txIndex);
        }
    }

    function _executeTransaction(uint _txIndex) private onlyRole(OWNER_ROLE) transactionExists(_txIndex) notExecuted(_txIndex)  {
        require(s_transactions[_txIndex].confirmations >= s_requiredConfirmation, "safewallet: not enought confirmations");
        s_transactions[_txIndex].to.transfer(s_transactions[_txIndex].amount);
        s_transactions[_txIndex].executed = true;
        emit ExecuteTransaction(_txIndex);
    }
}