"use client"

import { useState, useEffect } from "react"
import { useParams, Link as RouterLink } from "react-router-dom"
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
  Select,
  useToast,
  Spinner,
  Center,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  SimpleGrid,
} from "@chakra-ui/react"
import { useAuth } from "../context/AuthContext"
import { api, type Vote, type Group } from "../services/api"
import { Voting } from "../services/api"

export default function VotingDetail() {
  const { uuid } = useParams<{ uuid: string }>()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { address, isAdmin, signMessage } = useAuth()
  const [selectedGroup, setSelectedGroup] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [votes, setVotes] = useState<Vote[]>([])
  const [isLoadingVotes, setIsLoadingVotes] = useState(false)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)

  const [votingDetails, setVotingDetails] = useState<Voting | null>(null)
  const [isLoadingVotingDetails, setIsLoadingVotingDetails] = useState(false)

  const toast = useToast()

  const fetchVotes = async () => {
    if (!uuid) return

    setIsLoadingVotes(true)
    try {
      const fetchedVotes = await api.getVotes(uuid)
      setVotes(fetchedVotes)

      // Count votes
      const counts: Record<string, number> = {}
      fetchedVotes.forEach((vote) => {
        counts[vote.vote] = (counts[vote.vote] || 0) + 1
      })
      setVoteCounts(counts)
    } catch (error) {
      console.error("Error fetching votes:", error)
      toast({
        title: "Error",
        description: "Failed to fetch votes",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoadingVotes(false)
    }
  }

  const fetchGroups = async () => {
    setIsLoadingGroups(true)
    try {
      const fetchedGroups = await api.getAllGroups()
      setGroups(fetchedGroups)
    } catch (error) {
      console.error("Error fetching groups:", error)
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const fetchVotingDetails = async () => {
    if (!uuid) return

    setIsLoadingVotingDetails(true)
    try {
      const votings = await api.getAllVotings()
      const voting = votings.find(v => v.uuid === uuid)
      if (voting) {
        setVotingDetails(voting)
      }
    } catch (error) {
      console.error("Error fetching voting details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch voting details",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoadingVotingDetails(false)
    }
  }

  useEffect(() => {
    if (address && uuid) {
      fetchVotes()
      fetchGroups()
      fetchVotingDetails()
    }
  }, [address, uuid])

  const handleAssignGroup = async () => {
    if (!selectedGroup) {
      toast({
        title: "Error",
        description: "Please select a group",
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
        path: `/votings/${uuid}/groups/add`,
        group_uuid: selectedGroup,
      }

      const payload = await signMessage(message)
      await api.assignVotingToGroup(uuid, payload)

      toast({
        title: "Success",
        description: "Group assigned to voting successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      onClose()
      setSelectedGroup("")
    } catch (error) {
      console.error("Error assigning group:", error)
      toast({
        title: "Error",
        description: "Failed to assign group",
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
        <Heading mb={6}>Voting Details</Heading>
        <Card>
          <CardBody>
            <Text>Please connect your wallet to view voting details.</Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Voting Details</Heading>
        <Flex gap={4}>
          {isAdmin && (
            <Button onClick={onOpen} colorScheme="blue">
              Assign Group
            </Button>
          )}
          {!isAdmin && (
            <Button as={RouterLink} to={`/votings/${uuid}/vote`} colorScheme="green">
              Cast Vote
            </Button>
          )}
        </Flex>
      </Box>

      <Card mb={6}>
      <CardHeader>
        <Heading size="md">Voting Information</Heading>
      </CardHeader>
      <CardBody>
        <Text
          mb={3}
          fontSize="lg"
          fontWeight="medium"
        >
          <strong style={{fontSize: "1.1em", color: "#2D3748"}}>Name:</strong>{" "}
          {votingDetails?.name || "Loading..."}
        </Text>
        <Text mt={2}>
          <strong>Voting ID:</strong> {uuid}
        </Text>
        <Text mt={2}>
          <strong>Total Votes:</strong> <Badge colorScheme="blue">{votes.length}</Badge>
        </Text>
      </CardBody>
    </Card>

      {Object.keys(voteCounts).length > 0 && (
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Results</Heading>
          </CardHeader>
          <CardBody>
            <StatGroup>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} width="100%">
                {Object.entries(voteCounts).map(([option, count]) => (
                  <Stat key={option} p={4} shadow="sm" border="1px" borderColor="gray.200" borderRadius="md">
                    <StatLabel>Option {option}</StatLabel>
                    <StatNumber>{count}</StatNumber>
                  </Stat>
                ))}
              </SimpleGrid>
            </StatGroup>
          </CardBody>
        </Card>
      )}

      <Heading size="md" mb={4}>
        Vote History
      </Heading>

      {isLoadingVotes ? (
        <Center p={8}>
          <Spinner size="xl" />
        </Center>
      ) : votes.length === 0 ? (
        <Card>
          <CardBody>
            <Text>No votes have been cast yet.</Text>
          </CardBody>
        </Card>
      ) : (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Group</Th>
                <Th>Vote</Th>
                <Th>Nullifier</Th>
              </Tr>
            </Thead>
            <Tbody>
              {votes.map((vote) => (
                <Tr key={vote.id}>
                  <Td>{vote.id}</Td>
                  <Td>{vote.group_uuid.substring(0, 8)}...</Td>
                  <Td>{vote.vote}</Td>
                  <Td>{vote.nullifier.substring(0, 10)}...</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Group to Voting</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Select Group</FormLabel>
              {isLoadingGroups ? (
                <Center py={4}>
                  <Spinner />
                </Center>
              ) : (
                <Select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  placeholder="Select group"
                >
                  {groups.map((group) => (
                    <option key={group.uuid} value={group.uuid}>
                      {group.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAssignGroup}
              isLoading={isLoading}
              isDisabled={isLoadingGroups || !selectedGroup}
            >
              Assign Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

