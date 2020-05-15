import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import React from 'react'

import db from 'fake-indexeddb'
import Dexie from 'dexie'
Dexie.dependencies.indexedDB = db

import { usePoll } from '../lib/poll';

/*

interface Plan {
  _id: string,
  link: string,
  title: string,
  write_at: string,
  name: string,
  state: string,
  chip: string,
  sign: string,
  card: string[],
  upd: {
    description: string,
    time: string,
    interval: string,
    prologue: string,
    start: string,
  },
  lock: string[],
  flavor: string[],
  options: string[],
  tags: [string, string][],
}

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

function delay(timeout: number){
  return new Promise((ok, ng)=>{
    setTimeout(()=>{
      try {
        ok()
      } catch (e) {
        ng(e)
      }
    },timeout)
  })
}

test('basic value', (done)=>{
  function TestData(){
    async function api1(): Promise<any[]> {
      return new Promise((ok, ng)=>{
        setTimeout(async ()=>{
          ok([{}])
          await delay(100)
          done()
        },100)
      })
    }
    const useApi1 = usePoll(api1, [], '10m', '1.0.0')
    return(<p>{useApi1[0].length ? '〇' : '✖' }</p>)
  }
  const c = render(<TestData/>)
  expect(c.container).toMatchSnapshot()
});

