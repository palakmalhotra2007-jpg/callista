import React from 'react'
import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
    <ToastContainer position="top-right" autoClose={5000} newestOnTop closeOnClick theme="light" />
  </AuthProvider>
)
