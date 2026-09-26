import { createApp } from './app.ts'

const app = createApp()

app.listen(3000)

console.log(
  `E-Pembayaran SPP API running at ${app.server?.url}`,
)
