import { assert } from 'chai'
import path from 'path'
import fs from 'fs'
import { transformFileSync } from '@babel/core'
import usedPlugin from '../src/index'

function trim(str) {
  return str.replace(/^\s+|\s+$/, '')
}

describe('destructuring with default value', () => {
  const testDir = path.join(__dirname, './fixtures')
  fs.readdirSync(testDir).forEach((caseName) => {
    const filePath = path.join(testDir, caseName)
    let expected = fs
      .readFileSync(path.join(filePath, 'output.js'))
      .toString()

    const babelConfig = {
      // babelrc: true,
      plugins: [
        usedPlugin
      ].filter(Boolean),
    }


    const writed = transformFileSync(
      path.join(filePath, 'input.js'),
      babelConfig
    ).code

    describe(`${caseName} without this babel`, () => {
      it(caseName, () => {
        assert.strictEqual(trim(writed), trim(expected))
      })
    })
  })
})