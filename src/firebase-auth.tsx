import { useEffect, useState, createContext, useContext } from 'react'
import React from 'react'

import { User } from 'firebase/app'
import * as firebase from 'firebase/app'

if (__BROWSER__) {
  require('firebase/auth')
}

import { __BROWSER__ } from './device'

type ProviderProp = {
  children: React.ReactNode | React.ReactNode[]
}

type SetLoginProp = {
  signout?(): void
  facebook?(): void
  twitter?(): void
  github?(): void
  google?(): void
  microsoft?(): void
}

type FirebaseAuth = [
  User | null,
  firebase.auth.AdditionalUserInfo | null,
  firebase.auth.AuthCredential | null,
  SetLoginProp
]

export function useFirebaseAuth(): FirebaseAuth {
  const [user, setUser] = useState<firebase.User | null>(null)
  const [[additionalUserInfo, credential], setOption] = useState<
    [firebase.auth.AdditionalUserInfo | null, firebase.auth.AuthCredential | null]
  >([null, null])
  let setLogin
  if (user && credential) {
    setLogin = { signout }
  } else {
    setLogin = { facebook, twitter, github, google, microsoft }
  }
  const auth = firebase.auth()

  useEffect(() => {
    auth.onIdTokenChanged(setUser)
    auth.onAuthStateChanged(setUser)
    setPersistence().catch(onError)
    chkRedirected().catch(onError)
  }, [])

  return [user, additionalUserInfo, credential, setLogin]

  async function setPersistence(): Promise<void> {
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    console.log('session persistence')
  }

  async function chkRedirected(): Promise<void> {
    const redirectResult = await auth.getRedirectResult()
    const { operationType, user, additionalUserInfo, credential } = redirectResult
    console.log('get redirect result success', redirectResult)

    setUser(user)
    setOption([additionalUserInfo || null, credential])
  }

  function onError({ code, message }: { code: string; message: string }) {
    console.warn(code, message)
  }

  function signout() {
    firebase.auth().signOut()
    setUser(null)
    setOption([null, null])
  }
  function facebook() {
    auth.signInWithRedirect(new firebase.auth.FacebookAuthProvider())
  }
  function twitter() {
    auth.signInWithRedirect(new firebase.auth.TwitterAuthProvider())
  }
  function github() {
    auth.signInWithRedirect(new firebase.auth.GithubAuthProvider())
  }
  function google() {
    auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider())
  }
  function microsoft() {
    auth.signInWithRedirect(new firebase.auth.OAuthProvider('microsoft.com'))
  }
}

const FirebaseAuthContext = createContext<FirebaseAuth>([null, null, null, {}])

export function useAuth() {
  return useContext(FirebaseAuthContext)
}

export function FirebaseAuthProvider({ children }: ProviderProp) {
  const auth = useFirebaseAuth()
  return <FirebaseAuthContext.Provider value={auth}>{children}</FirebaseAuthContext.Provider>
}
