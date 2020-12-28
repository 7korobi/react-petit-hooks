import { render, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import React from 'react'

import db from 'fake-indexeddb'
import Dexie from 'dexie'
Dexie.dependencies.indexedDB = db

import { usePoll } from '../lib/poll'

test('basic value', (done) => {
  function TestData() {
    const [valApi1] = usePoll(api1, () => {}, [], '10m', '1.0.0')
    return <p>{valApi1 ? '〇' : '✖'}</p>

    async function api1(): Promise<{ pack: any[] }> {
      return new Promise((ok, ng) => {
        setTimeout(async () => {
          await act(async () => {
            ok({ pack: [] })
            await delay(100)
            done()
          })
        }, 100)
      })
    }
  }
  const c = render(<TestData />)
  expect(c.container).toMatchSnapshot()
})

/*

async function api_base<T,R>(res: Response, cb: (data: T)=> { pack: R }): Promise<{ pack: R }> {
  const data: T = await res.json()
  return Mem.State.transaction(()=>{
    cb(data)
  },{})
}

async function api2(): Promise<{ pack: Plan[] }> {
  return api_base(await fetch('https://giji-api.duckdns.org/api/plan/progress'), ({plans}) => {
    Mem.Set.plans.merge(plans)
  })
}


poll = (cb)->
  methods:
    get_by_network: ->
      for key, val of @timers
        clearTimeout val

      list = cb.call @
      list.map ([name, id])=>
        idx = [name, id].join("&")
        dexie.meta.delete idx
        dexie.data.delete idx
        is_cache[idx] = 0
      @_waitwake()
 */

function delay(timeout: number): Promise<void> {
  return new Promise((ok, ng) => {
    setTimeout(() => {
      try {
        ok()
      } catch (e) {
        ng(e)
      }
    }, timeout)
  })
}
