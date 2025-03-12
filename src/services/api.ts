import axios from "axios"
import { ethers } from "ethers"

const BASE_URL = "http://localhost:3000"

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

export interface Group {
  uuid: string
  name: string
  creator: string
  created: string
}

export interface GroupMember {
  id: number
  commitment: string
  identity_hash: string
  merkle_root: string
  proof: string
  creator: string
  created: string
  checkpoint_hash: string
}

export interface Voting {
  uuid: string
  name: string
  creator: string
  created: string
  voteCount?: number;
}

export interface Vote {
  id: number
  group_uuid: string
  nullifier: string
  merkle_root: string
  proof: string
  vote: string
  checkpoint_hash: string
}

export interface MerkleProof {
  leaf: string
  root: string
  siblings: string[]
  pathIndices: number[]
}

export const api = {
  // Auth
  getNonce: async (address: string): Promise<string> => {
    const response = await axiosInstance.get(`/nonces/${address}`)
    return response.data.nonce
  },

  // Groups
  createGroup: async (payload: any): Promise<Group> => {
    const response = await axiosInstance.post("/groups/add", payload)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return {
      uuid: extractedMessage.uuid,
      name: extractedMessage.group_name,
      creator: extractedMessage.creator,
      created: extractedMessage.timestamp,
    }
  },

  addGroupAdmin: async (groupUuid: string, payload: any): Promise<any> => {
    const response = await axiosInstance.post(`/groups/${groupUuid}/admins/add`, payload)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return extractedMessage
  },

  addGroupMember: async (groupUuid: string, payload: any): Promise<any> => {
    const response = await axiosInstance.post(`/groups/${groupUuid}/members/add`, payload)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return extractedMessage
  },

  getGroupMembers: async (groupUuid: string): Promise<GroupMember[]> => {
    const response = await axiosInstance.get(`/groups/${groupUuid}/members`)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return extractedMessage.members
  },

  getGroupRoot: async (groupUuid: string): Promise<string> => {
    const response = await axiosInstance.get(`/groups/${groupUuid}/root`)
    return response.data.root
  },

  getGroupCheckpointHash: async (groupUuid: string): Promise<string> => {
    const response = await axiosInstance.get(`/groups/${groupUuid}/checkpoint_hash`)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return extractedMessage.checkpoint_hash
  },

  getMerkleProof: async (groupUuid: string, commitment: string): Promise<MerkleProof> => {
    const response = await axiosInstance.get(`/groups/${groupUuid}/members/${commitment}/merkle_proof`)
    return response.data.merkle_proof
  },

  // Votings
  createVoting: async (payload: any): Promise<Voting> => {
    const response = await axiosInstance.post("/votings/add", payload)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return {
      uuid: extractedMessage.uuid,
      name: extractedMessage.voting_name,
      creator: extractedMessage.creator,
      created: extractedMessage.timestamp,
    }
  },

  assignVotingToGroup: async (votingUuid: string, payload: any): Promise<any> => {
    const response = await axiosInstance.post(`/votings/${votingUuid}/groups/add`, payload)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return extractedMessage
  },

  castVote: async (votingUuid: string, payload: any): Promise<any> => {
    const response = await axiosInstance.post(`/votings/${votingUuid}/vote`, payload)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return extractedMessage
  },

  getVotes: async (votingUuid: string): Promise<Vote[]> => {
    const response = await axiosInstance.get(`/votings/${votingUuid}/votes`)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return extractedMessage.votes
  },

  getVotingCheckpointHash: async (votingUuid: string): Promise<string> => {
    const response = await axiosInstance.get(`/votings/${votingUuid}/checkpoint_hash`)
    const [extractedMessage] = await verifyAndExtractMessage(response.data)
    return extractedMessage.checkpoint_hash
  },

  getAllGroups: async (): Promise<Group[]> => {
    const response = await axiosInstance.get('/groups')
    return response.data.groups
  },

  getAllVotings: async (): Promise<Voting[]> => {
    // This is a placeholder for a backend endpoint that would list all votings
    // You would need to implement this endpoint on your backend
    throw new Error("Not implemented on backend")
  },
}

// Helper function to verify and extract message from server response
async function verifyAndExtractMessage(payload: { content: string, signature: string, address: string }) {
  const { content, signature, address } = payload

  // Verify signature
  const recoveredAddress = ethers.verifyMessage(content, signature)

  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
    throw new Error("Invalid signature")
  }

  const nonce = await api.getNonce(address)

  // Extract and parse message
  const [base64nonce, base64message] = content.split(".", 2)
  const extractedNonce = ethers.toUtf8String(ethers.decodeBase64(base64nonce))

  if (extractedNonce != nonce)
    throw new Error("Nonce error!")

  const messageBytes = ethers.decodeBase64(base64message)
  const messageString = ethers.toUtf8String(messageBytes)
  const message = JSON.parse(messageString)

  return [message, recoveredAddress]
}

