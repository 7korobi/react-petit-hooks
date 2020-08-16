import { createContext, useContext, useEffect, useState } from 'react'
import React from 'react'
import { useLocalStorage } from './storage'

const IndexContext = createContext<[number, (idx: number) => void]>(null as any)

type IndexProviderProp = {
  key: string
  children: React.ReactNode
}

export function useIndex() {
  return useContext(IndexContext)
}

export function IndexProvider({ key, children }: IndexProviderProp) {
  const [index, setIndex] = useLocalStorage(key, 0)
  useEffect(() => {}, [index])
  return <IndexContext.Provider value={[index, setIndex]}>{children}</IndexContext.Provider>
}
