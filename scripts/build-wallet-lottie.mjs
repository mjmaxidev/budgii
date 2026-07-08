import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const W = 1024
const H = 768
const FPS = 30
const DURATION = 120

const pngPath = path.join(root, 'src/assets/budgii-login-wallet.png')
const outPath = path.join(root, 'src/assets/lottie/wallet-wiggle.json')
const b64 = fs.readFileSync(pngPath).toString('base64')

const ease = { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } }
const rotKf = (frames) => frames.map(([t, v]) => ({ t, s: [v], ...ease }))

const doc = {
  v: '5.9.6',
  fr: FPS,
  ip: 0,
  op: DURATION,
  w: W,
  h: H,
  nm: 'Budgii Wallet Wiggle',
  ddd: 0,
  assets: [{ id: 'wallet', w: W, h: H, u: '', p: `data:image/png;base64,${b64}`, e: 1 }],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 2,
      nm: 'wallet',
      refId: 'wallet',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: rotKf([
            [0, 0], [15, -5], [30, 5], [45, -4], [60, 4], [75, -2], [90, 2], [DURATION, 0],
          ]),
        },
        p: {
          a: 1,
          k: [
            { t: 0, s: [W / 2, H / 2, 0], to: [0, -4, 0], ti: [0, 4, 0] },
            { t: 30, s: [W / 2, H / 2 - 20, 0], to: [0, 4, 0], ti: [0, -4, 0] },
            { t: 60, s: [W / 2, H / 2, 0], to: [0, -4, 0], ti: [0, 4, 0] },
            { t: 90, s: [W / 2, H / 2 - 20, 0], to: [0, 4, 0], ti: [0, -4, 0] },
            { t: DURATION, s: [W / 2, H / 2, 0] },
          ],
        },
        a: { a: 0, k: [W / 2, H / 2, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      ip: 0,
      op: DURATION,
      st: 0,
      bm: 0,
    },
  ],
}

fs.writeFileSync(outPath, JSON.stringify(doc))
console.log(`Wrote ${outPath} (${Math.round(fs.statSync(outPath).size / 1024)} KB)`)
