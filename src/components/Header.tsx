import { CustomConnectButton } from './CustomConnectButton'

const Header = () => {
  return (
    <nav className="flex justify-between items-center mb-16">
      <h1 className="text-2xl font-bold text-center text-white">MicMacMoe</h1>
      <CustomConnectButton />
    </nav>
  )
}

export default Header
