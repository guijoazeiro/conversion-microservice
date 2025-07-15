import http from 'http'
import app from './app'
import { PORT } from './config/enviroment'

const server = http.createServer(app)
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})