// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.4.17;

contract CampaignFactory {
    Campaign[] public deployedCampaigns;

    function createCampaign(uint256 min) public {
        Campaign newCampaign = new Campaign(min, msg.sender);
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampaigns() public view returns (Campaign[] memory) {
        return deployedCampaigns;
    }
}

contract Campaign {
    struct Request {
        string desc;
        uint256 val;
        address payable rec;
        bool complete;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }

    // TODO: Convert this to dynamic array.
    Request[5] public requests;
    address public manager;
    uint256 public minContri;

    // Keys are not stored in mapping, hence cannot be iterated upon, this is a hash data structure.
    mapping(address => bool) public approvers;
    uint256 public approversCount;
    uint256 public numRequests;

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    constructor(uint256 min, address creator) {
        manager = creator;
        minContri = min;
        numRequests = 0;
    }

    function contribute() public payable {
        require(msg.value > minContri);
        approvers[msg.sender] = true;
        approversCount++;
    }

    function createRequest(
        string calldata desc,
        uint256 value,
        address recp
    ) public restricted {

        Request storage newRequest;
        newRequest = requests[numRequests];
        numRequests++;
        newRequest.desc = desc;
        newRequest.val = value;
        newRequest.rec = payable(recp);
        newRequest.complete = false;
        newRequest.approvalCount = 0;
    }

    function approveRequest(uint256 index) public {
        Request storage req = requests[index];

        require(approvers[msg.sender]);
        require(!req.approvals[msg.sender]);

        req.approvals[msg.sender] = true;
        req.approvalCount++;
    }

    function finalizeRequest(uint256 index) public restricted {
        Request storage req = requests[index];

        require(req.approvalCount > (approversCount / 2));
        require(!req.complete);

        req.rec.transfer(req.val);
        req.complete = true;
    }
}
