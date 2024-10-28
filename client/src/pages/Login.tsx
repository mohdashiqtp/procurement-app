import React, { useState, useEffect, useContext } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import AuthContext from '../AuthContext';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  _id: string;
  name: string;
}

const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/auth/login`,
    credentials,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const auth = useContext(AuthContext);

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      const { token, _id, name } = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ _id, name }));
      auth.signin(_id, () => {
        enqueueSnackbar('Login successful!', { variant: 'success' });
        navigate('/', { replace: true });
      });
    },
    onError: (error) => {
      console.error('Login failed:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      enqueueSnackbar('Login failed. Please check your credentials.', { variant: 'error' });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      enqueueSnackbar('Please fill in all fields', { variant: 'warning' });
      return;
    }
    mutation.mutate(formData);
  };

  const fillTestCredentials = () => {
    setFormData({
      username: 'test@gmail.com',
      password: '9072553698'
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="h-11 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="h-11 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Logging in...' : 'Sign In'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="w-full h-11 border-gray-200 hover:bg-gray-50 text-gray-700"
              onClick={fillTestCredentials}
            >
              Use Test Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
