import express from 'express'
import cors from 'cors'

import showsRouter from './routes/shows'
import photosRouter from './routes/photos'
import mediaRouter from './routes/media'
import contactRouter from './routes/contact'
import profileRouter from './routes/profile'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.use('/api/shows', showsRouter)
app.use('/api/gallery', photosRouter)
app.use('/api/media', mediaRouter)
app.use('/api/contact', contactRouter)
app.use('/api/profile', profileRouter)

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
