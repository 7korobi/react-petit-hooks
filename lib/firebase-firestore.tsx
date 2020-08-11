import { useEffect, useState, useRef } from 'react'
import React from 'react'

import { firestore } from 'firebase/app'

if (__BROWSER__) {
  require('firebase/firestore')
}

import { __BROWSER__ } from './device'

type DIC<T> = { [path: string]: T }
type Options = firestore.SnapshotOptions & firestore.SnapshotListenOptions

type GetQueries<T> = {
  (db: firestore.Firestore): firestore.Query<T>[]
}
type GetDocumentReference<T> = {
  (db: firestore.Firestore): firestore.DocumentReference<T>
}
type ProviderProp = {
  children: React.ReactNode | React.ReactNode[]
}

type FirestoreCollectionHook<T> = [T[], DIC<T>]

export function useFirestoreCollection<T>(
  get: GetQueries<T>,
  { serverTimestamps, includeMetadataChanges }: Options
): FirestoreCollectionHook<T> {
  const [now, setNow] = useState(new Date().getTime())
  const [data, dic] = useRef<[T[][], DIC<T>]>([[], {}]).current

  const db = firestore()
  const queries = get(db)
  const list: T[] = []
  data.forEach((docs) => {
    docs.forEach((doc) => {
      list.push(doc)
    })
  })

  useEffect(() => {
    queries.forEach((_query, idx) => {
      data[idx] = []
    })
    const unregists: (() => void)[] = queries.map(regist)
    return () => {
      unregists.forEach((cb) => {
        cb()
      })
    }
  }, queries)

  return [list, dic]

  function regist(q: firestore.Query<T>, idx: number) {
    return q.onSnapshot(
      { includeMetadataChanges },
      (qs) => {
        qs.docChanges().forEach((change) => {
          const { newIndex, oldIndex, doc } = change
          const { id, metadata, exists } = doc
          const { path } = doc.ref
          const item = doc.data({ serverTimestamps })
          console.log(change.type, newIndex, oldIndex, path, exists, item, metadata)
          switch (change.type) {
            case 'added':
              onAppend(item, idx, newIndex, id, path)
              break
            case 'modified':
              onModify(item, idx, newIndex, oldIndex, id, path)
              break
            case 'removed':
              onRemove(item, idx, oldIndex, id, path)
              break
          }
        })
        setNow(new Date().getTime())
      },
      onError
    )
  }

  function onAppend(doc: T, listIdx: number, newIdx: number, id: string, path: string) {
    data[listIdx][newIdx] = doc
    dic[id] = doc
  }
  function onModify(
    doc: T,
    listIdx: number,
    newIdx: number,
    oldIdx: number,
    id: string,
    path: string
  ) {
    data[listIdx][newIdx] = doc
    dic[id] = doc
  }
  function onRemove(oldDoc: T, listIdx: number, oldIdx: number, id: string, path: string) {
    delete data[listIdx][oldIdx]
    delete dic[id]
  }
  function onError(e: Error) {
    console.error(e)
  }
}

export function useFirestoreDocument<T>(
  get: GetDocumentReference<T>,
  { serverTimestamps, includeMetadataChanges }: Options
): T | null {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    const unregist = regist()
    return () => {
      unregist()
    }
  }, [])

  return data

  function regist() {
    const db = firestore()
    const docRef = get(db)
    return docRef.onSnapshot({ includeMetadataChanges }, (doc) => {
      const { id, metadata, exists } = doc
      const { path } = docRef
      const item = doc.data({ serverTimestamps }) || null
      console.log(path, exists, item, metadata)
      setData(item)
    }, onError)
  }
  function onError(e: Error) {
    console.error(e)
  }
}
