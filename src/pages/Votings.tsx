"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
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
} from "@chakra-ui/react"
import { Link as RouterLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { api, type Voting } from "../services/api"

export default function Votings() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { address, isAdmin, signMessage } = useAuth()
  const [votingName, setVotingName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [votings, setVotings] = useState<Voting[]>([])
  const [isLoadingVotings, setIsLoadingVotings] = useState(false)
  const toast = useToast()

  // Update the fetchVotings function to use the real API
  const fetchVotings = async () => {
    setIsLoadingVotings(true)
    try {
      const fetchedVotings = await api.getAllVotings()
      setVotings(fetchedVotings)
    } catch (error) {
      console.error("Error fetching votings:", error)
      toast({
        title: "Error",
        description: "Failed to fetch votings",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoadingVotings(false)
    }
  }

  useEffect(() => {
    if (address) {
      fetchVotings()
    }
  }, [address])

  const handleCreateVoting = async () => {
    if (!votingName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a voting name",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    try {
      const message = {
        path: "/votings/add",
        voting_name: votingName,
      }

      const payload = await signMessage(message)
      const newVoting = await api.createVoting(payload)

      setVotings([...votings, newVoting])

      toast({
        title: "Success",
        description: "Voting created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      onClose()
      setVotingName("")
    } catch (error) {
      console.error("Error creating voting:", error)
      toast({
        title: "Error",
        description: "Failed to create voting",
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
        <Heading mb={6}>Votings</Heading>
        <Card>
          <CardBody>
            <Text>Please connect your wallet to view votings.</Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Votings</Heading>
        {isAdmin && (
          <Button onClick={onOpen} colorScheme="blue">
            Create Voting
          </Button>
        )}
      </Box>

      {isLoadingVotings ? (
        <Center p={8}>
          <Spinner size="xl" />
        </Center>
      ) : votings.length === 0 ? (
        <Card>
          <CardBody>
            <Text>No votings found. Create a new voting to get started.</Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {votings.map((voting) => (
            <Card key={voting.uuid}>
              <CardHeader>
                <Heading size="md">{voting.name}</Heading>
              </CardHeader>
              <CardBody>
                <Text fontSize="sm" color="gray.500">
                  Created: {new Date(voting.created).toLocaleDateString()}
                </Text>
              </CardBody>
              <CardFooter>
                <Button as={RouterLink} to={`/votings/${voting.uuid}`} colorScheme="blue" variant="outline">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Voting</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Voting Name</FormLabel>
              <Input
                value={votingName}
                onChange={(e) => setVotingName(e.target.value)}
                placeholder="Enter voting name"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateVoting} isLoading={isLoading}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

