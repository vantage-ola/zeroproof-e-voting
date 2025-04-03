"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import {
  Box,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Spinner,
  Center,
  Card,
  CardHeader,
  CardBody,
  Badge,
} from "@chakra-ui/react"
import { useAuth } from "../context/AuthContext"
import { api, type GroupMember, type Group } from "../services/api"
import { CopyIcon } from "@chakra-ui/icons"
import { isAddress } from "ethers"

export default function GroupDetail() {
  const { uuid } = useParams<{ uuid: string }>()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { address, isAdmin, signMessage } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [groupRoot, setGroupRoot] = useState("")
  const [newMemberAddress, setNewMemberAddress] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)

  const [isGroupIdCopied, setIsGroupIdCopied] = useState(false)

  const [groupDetails, setGroupDetails] = useState<Group | null>(null)
  const [isLoadingGroupDetails, setIsLoadingGroupDetails] = useState(false)

  const copyGroupId = () => {
    if (uuid) {
      navigator.clipboard.writeText(uuid)
      setIsGroupIdCopied(true)
      setTimeout(() => setIsGroupIdCopied(false), 2000)
    }
  }

  const toast = useToast()

  const fetchGroupMembers = async () => {
    if (!uuid) return

    setIsLoadingMembers(true)
    try {
      const fetchedMembers = await api.getGroupMembers(uuid)
      setMembers(fetchedMembers)

      const root = await api.getGroupRoot(uuid)
      setGroupRoot(root)
    } catch (error) {
      console.error("Error fetching group members:", error)
      toast({
        title: "Error",
        description: "Failed to fetch group members",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const fetchGroupDetails = async () => {
    if (!uuid) return

    setIsLoadingGroupDetails(true)
    try {
      const groups = await api.getAllGroups()
      const group = groups.find(g => g.uuid === uuid)
      if (group) {
        setGroupDetails(group)
      }
    } catch (error) {
      console.error("Error fetching group details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch group details",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoadingGroupDetails(false)
    }
  }

  useEffect(() => {
    if (address && uuid) {
      fetchGroupMembers()
      fetchGroupDetails()
    }
  }, [address, uuid])

  const handleAddMember = async () => {
    if (!uuid || !newMemberAddress || !isAddress(newMemberAddress)) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsAddingMember(true)
    try {
      // First get or create the user's identity
      const identity = await api.createOrGetUserIdentity(newMemberAddress)

      // Prepare the payload for adding member
      const payload = {
        path: `/groups/${uuid}/members/add`,
        commitment: identity.commitment,
        identity_hash: identity.encryptedPrivateKey, // Using encrypted private key as identity hash
        proof: "proof", // Placeholder proof
      }

      // Sign the message (assuming your auth context has this)
      const signedMessage = await signMessage(payload)

      // Add the member to the group
      await api.addGroupMember(uuid, signedMessage)

      toast({
        title: "Success",
        description: "Member added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      // Refresh the members list
      await fetchGroupMembers()
      onClose()
      setNewMemberAddress("")
    } catch (error) {
      console.error("Error adding member:", error)
      toast({
        title: "Error",
        description: "Failed to add member",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsAddingMember(false)
    }
  }

  if (!address) {
    return (
      <Box>
        <Heading mb={6}>Group Details</Heading>
        <Card>
          <CardBody>
            <Text>Please connect your wallet to view group details.</Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Group Details</Heading>
        {isAdmin && (
          <Button onClick={onOpen} colorScheme="blue">
            Add Member
          </Button>
        )}
      </Box>

      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Group Information</Heading>
        </CardHeader>
        <CardBody>
        <Text
          mb={3}
          fontSize="lg"
          fontWeight="medium"
        >
          <strong style={{fontSize: "1.1em", color: "#2D3748"}}>Name:</strong>{" "}
          {groupDetails?.name || "Loading..."}
        </Text>
          <Box display="flex" alignItems="center">
            <Text mr={2}>
              <strong>Group ID:</strong> {uuid}
            </Text>
            <Button
              size="xs"
              onClick={copyGroupId}
              leftIcon={<CopyIcon />}
              colorScheme={isGroupIdCopied ? "green" : "gray"}
            >
              {isGroupIdCopied ? "Copied!" : "Copy"}
            </Button>
          </Box>
          <Text mt={2}>
            <strong>Merkle Root:</strong> {groupRoot ? groupRoot : "Loading..."}
          </Text>
          <Text mt={2}>
            <strong>Members:</strong> <Badge colorScheme="blue">{members.length}</Badge>
          </Text>
        </CardBody>
      </Card>

      <Heading size="md" mb={4}>
        Members
      </Heading>

      {isLoadingMembers ? (
        <Center p={8}>
          <Spinner size="xl" />
        </Center>
      ) : members.length === 0 ? (
        <Card>
          <CardBody>
            <Text>No members found in this group.</Text>
          </CardBody>
        </Card>
      ) : (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Commitment</Th>
                <Th>Identity Hash</Th>
                <Th>Created By</Th>
                <Th>Created At</Th>
              </Tr>
            </Thead>
            <Tbody>
              {members.map((member) => (
                <Tr key={member.id}>
                  <Td>{member.id}</Td>
                  <Td>{member.commitment.substring(0, 10)}...</Td>
                  <Td>{member.identity_hash.substring(0, 10)}...</Td>
                  <Td>
                    {member.creator.substring(0, 6)}...{member.creator.substring(member.creator.length - 4)}
                  </Td>
                  <Td>{new Date(member.created).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Group Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Member Ethereum Address</FormLabel>
              <Input
                placeholder="0x..."
                value={newMemberAddress}
                onChange={(e) => setNewMemberAddress(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              isLoading={isAddingMember}
              isDisabled={!newMemberAddress || !isAddress(newMemberAddress)}
            >
              Add Member
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

