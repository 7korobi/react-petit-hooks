import React = require('react')
import renderer from 'react-test-renderer'
import { Bits, pushUrlStore, useStore } from '../lib/storage';

pushUrlStore({
  data_b: false,
  data_s: 'test string data',
  data_n: 123456789,
  bits: new Bits({
    a: true,
    c: true,
    e: true,
  },"abcdefg".match(/./g)||[])
});


function TestData(){
  const useB = useStore<boolean>('data_b')
  const useS = useStore<string>('data_s')
  const useN = useStore<number>('data_n')
  const useBitA = useStore<boolean>('bits.a')
  const useBitB = useStore<boolean>('bits.b')
  const useBitC = useStore<boolean>('bits.c')
  const useBitD = useStore<boolean>('bits.d')
  const useBitE = useStore<boolean>('bits.e')
  const useBitF = useStore<boolean>('bits.f')
  const useBitG = useStore<boolean>('bits.g')
  return(<p>
    <b>{useB[0]}</b>
    <b>{useS[0]}</b>
    <b>{useN[0]}</b>
    <b>{useBitA[0]}</b>
    <b>{useBitB[0]}</b>
    <b>{useBitC[0]}</b>
    <b>{useBitD[0]}</b>
    <b>{useBitE[0]}</b>
    <b>{useBitF[0]}</b>
    <b>{useBitG[0]}</b>
  </p>)
}

test('basic value', ()=>{
  const component = renderer.create(<TestData/>);
  expect(component.toJSON()).toMatchSnapshot()
});

