const express = require('express')
const crypto = require('node:crypto')
const cors = require('cors')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./movies.js')

// Create app
const app = express()
// Disable header X-Powered-By: Express
app.disable('x-powered-by')
// Amazing middleware to parse params
app.use(express.json())
// CORS: an easier way to use it but is important to validate it!
app.use(
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:8080'
      ]

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true)
      }

      if (!origin) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    }
  })
)

// Get initial route
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

// const ACCEPTED_ORIGINS = ['http://localhost:3000', 'http://localhost:8080']

// Get all movies
app.get('/movies', (req, res) => {
  // If you put *, you will give access to every domain
  // If you want to put your domain, is important to keep in mind that the port can change so you need to think about it dynamically
  // You can also make a list of "Accepted Origins" to recovery the origin req.header('origin') and allow them
  // SOMETIMES the browser doesn't send you the origin in the header, when you make a request from the SAME origin
  /* const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  } */
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some(
        (g) => g.toLocaleLowerCase() === genre.toLocaleLowerCase()
      )
    )
    res.json(filteredMovies)
  }
  res.json(movies)
})

// Get a movie by id
app.get('/movies/:id', (req, res) => {
  // path-to-regexp, you can create different combinations to be read
  const { id } = req.params
  const movie = movies.find((movie) => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

// Create a movie with POST
app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // You can also use 422 error: Unprocessable Entity
    return res.status(400).json({ error: result.error.message })
  }

  // This should be in the database
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data // ❌ Is not the same than just give req.body
  }
  // This is not REST, because we're saving the state of the app in memory
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

// Delete a movie
app.delete('/movies/:id', (req, res) => {
  /* const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  } */

  const { id } = req.params

  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex < 0) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

// Update a movie with PATCH
app.patch('/movies/:id', (req, res) => {
  const { id } = req.params
  const result = validatePartialMovie(req.body)

  if (result.error) {
    res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const movieIndex = movies.findIndex((movie) => movie.id === id)

  if (movieIndex < 0) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updatedMovie = { ...movies[movieIndex], ...result.data }

  movies[movieIndex] = updatedMovie

  return res.json(updatedMovie)
})

/* app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  }
  res.send(200)
}) */

// Choose/define PORT
const PORT = process.env.PORT ?? 1234

// Listen the defined PORT
app.listen(PORT, () => {
  console.log(`Server listening on PORT http://localhost:${PORT}`)
})
