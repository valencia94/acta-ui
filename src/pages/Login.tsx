import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { Button, Flex, Heading, Image, Stack } from '@chakra-ui/react';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { skipAuth } from '../env.variables';

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const nav = useNavigate();
  const { register, handleSubmit } = useForm<FormData>();

  useEffect(() => {
    if (!skipAuth) {
      signOut().catch(() => {});
    }
  }, []);

  async function onSubmit({ email, password }: FormData) {
    try {
      if (skipAuth) {
        localStorage.setItem('ikusi.jwt', 'dev-token');
      } else {
        await signIn({ username: email, password });
        const { tokens } = await fetchAuthSession();
        const token = tokens?.idToken?.toString() ?? '';
        localStorage.setItem('ikusi.jwt', token);
      }
      nav('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Sign-in failed');
    }
  }

  const MotionButton = motion(Button);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" p={4}>
      <Stack
        gap={6}
        w="full"
        maxW="md"
        bg="white"
        rounded="xl"
        shadow="lg"
        py={12}
        px={8}
      >
        <Image
          src="/assets/ikusi-logo.png"
          alt="Ikusi logo"
          boxSize="72px"
          mx="auto"
        />
        <Heading size="lg" className="text-center text-ikusi-dark">
          Acta Platform
        </Heading>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input className="input" type="email" {...register('email')} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              className="input"
              type="password"
              {...register('password')}
            />
          </FormControl>
          <MotionButton
            mt={4}
            w="full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-md bg-[#4ac795] py-2 text-white hover:bg-[#3cb488]"
            type="submit"
          >
            Sign in
          </MotionButton>
        </form>
      </Stack>
    </Flex>
  );
}
