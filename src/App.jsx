import socketClient from 'socket.io-client'
import './App.css'
import Home from './components/Home'

function App() {
  const io = socketClient('http://localhost:8000')
return(
  <Home io={io} />
)
}

export default App
