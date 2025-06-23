// Codex: Updated visual layout
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

  const MotionButton = motion.button;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white px-8 py-12 shadow-lg">
        <img
          src="/assets/ikusi-logo.png"
          alt="Ikusi logo"
          className="mx-auto h-16 w-16"
        />
        <h1 className="text-center text-2xl font-bold text-ikusi-dark">
          Acta Platform
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block font-medium">Email</label>
            <input
              type="email"
              className="input"
              required
              {...register('email')}
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Password</label>
            <input
              type="password"
              className="input"
              required
              {...register('password')}
            />
          </div>
          <MotionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-md bg-[#4ac795] py-2 text-white hover:bg-[#3cb488]"
            type="submit"
          >
            Sign in
          </MotionButton>
        </form>
      </div>
    </div>
  );
}
