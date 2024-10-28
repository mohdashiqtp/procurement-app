import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import Register from './pages/Signup'
import Layout from './components/Layout'
import NoPageFound from './pages/NotFound'
import AuthContext from './AuthContext'
import ProtectedWrapper from './ProtectedWrapper'
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './components/DashBoard'
import PurchaseOrder from './pages/PurchaseOrder'
import Item from './pages/Item'
import Supplier from './pages/Supplier'
import PurchaseOrders from './pages/PurchaseOrders'
import { SnackbarProvider } from 'notistack'

// QueryClient is created outside component to prevent recreation on renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const [user, setUser] = useState<string>("")
  const [loader, setLoader] = useState<boolean>(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser._id)
          setIsAuthenticated(true)
        } catch (error) {
          console.error("Error parsing user data:", error)
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
      setLoader(false)
    }

    checkAuth()
  }, [])

  const signin = (newUser: any, callback: () => void) => {
    setUser(newUser)
    setIsAuthenticated(true)
    callback()
  }

  const signout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser("")
    setIsAuthenticated(false)
  }

  const authContextValue = {
    user,
    signin,
    signout,
    isAuthenticated
  }

  if (loader) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h1>LOADING...</h1>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <BrowserRouter>
        <SnackbarProvider maxSnack={3}>
          <TooltipProvider>
            <QueryClientProvider client={queryClient}>
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    isAuthenticated ? (
                      <Navigate to="/" replace />
                    ) : (
                      <Login />
                    )
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    isAuthenticated ? (
                      <Navigate to="/" replace />
                    ) : (
                      <Register />
                    )
                  } 
                />
                <Route
                  path="/"
                  element={
                    <ProtectedWrapper>
                      <Layout className="w-full" />
                    </ProtectedWrapper>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="/create-purchase-order" element={<PurchaseOrder />} />
                  <Route path="/create-purchase-order/:id" element={<PurchaseOrder />} />
                  <Route path="/purchase-order" element={<PurchaseOrders />} />
                  <Route path="/items" element={<Item />} />
                  <Route path="/suppliers" element={<Supplier />} />
                </Route>
                <Route path="*" element={<NoPageFound />} />
              </Routes>
            </QueryClientProvider>
          </TooltipProvider>
        </SnackbarProvider>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
