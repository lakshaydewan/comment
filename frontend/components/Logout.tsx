import { useRouter } from 'next/navigation'
import React from 'react'

const Logout = () => {

    const router = useRouter();

  return (
    <button
    onClick={()=> {
        localStorage.removeItem('token')
        router.push('/');
    }}
    className='bg-blue-600 absolute top-6 left-6 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700'>
        Log Out
    </button>
  )
}

export default Logout