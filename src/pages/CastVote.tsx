"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  useToast,
  RadioGroup,
  Radio,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react"
import { useAuth } from "../context/AuthContext"
import { api } from "../services/api"
import { Identity, generateProof } from "@semaphore-protocol/core"
import { uuidToHex } from "../utils/conversion"

export default function CastVote() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const { address } = useAuth()
  const [selectedOption, setSelectedOption] = useState("")
  const [groupUuid, setGroupUuid] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  // Options for the vote
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
    { value: "3", label: "Option 3" },
    { value: "4", label: "Option 4" },
  ]

  useEffect(() => {
    // Create a new identity when the component mounts
    const newIdentity = new Identity()
    setIdentity(newIdentity)
  }, [])

  const handleCastVote = async () => {
    if (!selectedOption) {
      toast({
        title: "Error",
        description: "Please select an option",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!groupUuid) {
      toast({
        title: "Error",
        description: "Please enter a group UUID",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!uuid || !identity) return

    setIsLoading(true)
    setError(null)

    try {
      // 1. Get merkle proof
      try {
        const merkleProofResponse = await api.getMerkleProof(groupUuid, identity.commitment.toString())

        // 2. Generate ZK proof
        const scope = uuidToHex(uuid)
        const proof = await generateProof(identity, merkleProofResponse, Number.parseInt(selectedOption), scope)

        // 3. Submit vote
        const payload = {
          group_uuid: groupUuid,
          proof: proof,
        }

        await api.castVote(uuid, payload)

        toast({
          title: "Success",
          description: "Your vote has been cast successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        })

        // Navigate back to voting details
        navigate(`/votings/${uuid}`)
      } catch (error) {
        console.error("Error with merkle proof:", error)
        setError("You are not a member of an eligible group for this voting.")
      }
    } catch (error) {
      console.error("Error casting vote:", error)
      setError("Failed to cast vote. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!address) {
    return (
      <Box>
        <Heading mb={6}>Cast Vote</Heading>
        <Card>
          <CardBody>
            <Text>Please connect your wallet to cast a vote.</Text>
          </CardBody>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Heading mb={6}>Cast Your Vote</Heading>

      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Group Information</Heading>
        </CardHeader>
        <CardBody>
          <FormControl mb={4}>
            <FormLabel>Group UUID</FormLabel>
            <Input
              value={groupUuid}
              onChange={(e) => setGroupUuid(e.target.value)}
              placeholder="Enter the UUID of the group you belong to"
            />
          </FormControl>

          <Text fontSize="sm" color="gray.600">
            Your identity commitment:{" "}
            {identity ? identity.commitment.toString().substring(0, 10) + "..." : "Loading..."}
          </Text>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Select an Option</Heading>
        </CardHeader>
        <CardBody>
          <RadioGroup onChange={setSelectedOption} value={selectedOption}>
            <Stack direction="column" spacing={4}>
              {options.map((option) => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </CardBody>
        <CardFooter>
          <Button
            colorScheme="blue"
            onClick={handleCastVote}
            isLoading={isLoading}
            isDisabled={!selectedOption || !groupUuid}
          >
            Cast Vote
          </Button>
        </CardFooter>
      </Card>
    </Box>
  )
}

