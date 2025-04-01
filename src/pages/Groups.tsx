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
import { api, type Group } from "../services/api"

export default function Groups() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { address, isAdmin, signMessage } = useAuth()
  const [groupName, setGroupName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const toast = useToast()

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

  useEffect(() => {
    if (address) {
      fetchGroups()
    }
  }, [address])

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    try {
      const message = {
        path: "/groups/add",
        group_name: groupName,
      }

      const payload = await signMessage(message)
      const newGroup = await api.createGroup(payload)

      setGroups([...groups, newGroup])

      toast({
        title: "Success",
        description: "Group created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      onClose()
      setGroupName("")
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error",
        description: "Failed to create group",
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
        <Heading mb={6}>Groups</Heading>
        <Card>
          <CardBody>
            <Text>Please connect your wallet to view groups.</Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Groups</Heading>
        {isAdmin && (
          <Button onClick={onOpen} colorScheme="blue">
            Create Group
          </Button>
        )}
      </Box>

      {isLoadingGroups ? (
        <Center p={8}>
          <Spinner size="xl" />
        </Center>
      ) : groups.length === 0 ? (
        <Card>
          <CardBody>
            <Text>No groups found. Create a new group to get started.</Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {groups.map((group) => (
            <Card key={group.uuid}>
              <CardHeader>
                <Heading size="md">{group.name}</Heading>
              </CardHeader>
              <CardBody>
                <Text fontSize="sm" color="gray.500">
                  Created: {new Date(group.created).toLocaleDateString()}
                </Text>
              </CardBody>
              <CardFooter>
                <Button as={RouterLink} to={`/groups/${group.uuid}`} colorScheme="blue" variant="outline">
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
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Group Name</FormLabel>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name" />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateGroup} isLoading={isLoading}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

