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
    <div className="flex min-h-screen items-center justify-center bg-emerald-50 p-6">
      <div className="backdrop-blur-md bg-white/30 shadow-xl rounded-2xl p-10 w-full max-w-md">
        <img
          src="/assets/ikusi-logo.png"
          alt="Ikusi logo"
          className="mx-auto h-12 mb-4"
        />
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Acta Platform
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder="Email"
              required
              {...register('email')}
              className="peer h-10 w-full border-b-2 border-gray-300 bg-transparent placeholder-transparent focus:border-emerald-600 focus:outline-none"
            />
            <label
              htmlFor="email"
              className="absolute left-0 -top-3.5 text-sm text-gray-600 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-sm"
            >
              Email
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type="password"
              placeholder="Password"
              required
              {...register('password')}
              className="peer h-10 w-full border-b-2 border-gray-300 bg-transparent placeholder-transparent focus:border-emerald-600 focus:outline-none"
            />
            <label
              htmlFor="password"
              className="absolute left-0 -top-3.5 text-sm text-gray-600 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-sm"
            >
              Password
            </label>
          </div>
          <MotionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-md bg-emerald-600 py-2 text-white hover:bg-emerald-700"
            type="submit"
          >
            Sign in
          </MotionButton>
        </form>
      </div>
    </div>
  );
}
