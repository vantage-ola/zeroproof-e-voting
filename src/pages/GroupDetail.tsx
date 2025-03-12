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
import { api, type GroupMember } from "../services/api"

export default function GroupDetail() {
  const { uuid } = useParams<{ uuid: string }>()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { address, isAdmin, signMessage } = useAuth()
  const [commitment, setCommitment] = useState("")
  const [identityHash, setIdentityHash] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [groupRoot, setGroupRoot] = useState("")
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

  useEffect(() => {
    if (address && uuid) {
      fetchGroupMembers()
    }
  }, [address, uuid])

  const handleAddMember = async () => {
    if (!commitment.trim() || !identityHash.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!uuid) return

    setIsLoading(true)
    try {
      const message = {
        path: `/groups/${uuid}/members/add`,
        commitment,
        identity_hash: identityHash,
        proof: "proof", // In a real app, you would generate a proper proof
      }

      const payload = await signMessage(message)
      await api.addGroupMember(uuid, payload)

      // Refresh the members list
      await fetchGroupMembers()

      toast({
        title: "Success",
        description: "Member added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      onClose()
      setCommitment("")
      setIdentityHash("")
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
      setIsLoading(false)
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
          <Text>
            <strong>Group ID:</strong> {uuid}
          </Text>
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
            <FormControl mb={4}>
              <FormLabel>Commitment</FormLabel>
              <Input
                value={commitment}
                onChange={(e) => setCommitment(e.target.value)}
                placeholder="Enter commitment"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Identity Hash</FormLabel>
              <Input
                value={identityHash}
                onChange={(e) => setIdentityHash(e.target.value)}
                placeholder="Enter identity hash"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddMember} isLoading={isLoading}>
              Add Member
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

